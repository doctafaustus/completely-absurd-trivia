const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Cloudstore config
let serviceAccount = process.env.SERVICE_ACCOUNT_KEY;
if (!process.env.PORT) serviceAccount = require('./private/serviceAccountKey.json');
else serviceAccount = JSON.parse(serviceAccount);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();


app.use(express.static(`${__dirname}/client/dist`));
app.use(bodyParser.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/client/dist/index.html`);
});

app.get('/lobby', (req, res) => {
  res.sendFile(`${__dirname}/client/dist/lobby.html`);
});

app.get('/game', (req, res) => {
  res.sendFile(`${__dirname}/client/dist/game.html`);
});

app.post('/api/add-if-new', async (req, res) => {
  console.log('/api/add-if-new');

  const { authUser } = req.body;
  const usersCollection = db.collection('users');
  const docRef = usersCollection.doc(authUser.uid);
  
  const doc = await docRef.get();
  if (doc.exists) {
    docRef.update({ lastLoggedIn: new Date().getTime() });
    res.json({ id: doc.id, ...doc.data() });
  } else {
    const randomNum = Math.ceil(Math.random() * 1000);
    await docRef.set({
      email: authUser.email,
      username: `newbie_${randomNum}${(+new Date).toString(36)}`,
      friends: [],
      created: new Date().getTime(),
      lastLoggedIn: new Date().getTime()
    });
    const updatedDoc = await docRef.get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  }
});

app.post('/api/find-friend', async (req, res) => {
  console.log('/api/find-friend');

  const { searchTerm } = req.body;
  const usersCollection = db.collection('users');

  // Find all users whose searchTerm starts with search term
  const query = await usersCollection.where('username', '>=', searchTerm).where('username', '<=', searchTerm+ '\uf8ff');

  query.get().then(querySnapshot => {
    const result = querySnapshot.docs.map(doc => doc.data().username);
    res.json(result);
  })
  .catch(error => {
    console.log(`Error getting documents: ${error}`);
    res.json([]);
  });
});

app.post('/api/add-friend', async (req, res) => {
  console.log('/api/add-friend');

  const { currentUserID, friendToAdd } = req.body;
  const usersCollection = db.collection('users');

  const docRef = usersCollection.doc(currentUserID);
  const doc = await docRef.get();

  if (!doc.exists) return res.json({ result: 'Current user not found' });
  await docRef.update({
    friends: admin.firestore.FieldValue.arrayUnion(friendToAdd)
  });

  res.json({ result: `Friend added: ${friendToAdd}` });
});

app.post('/api/remove-friend', async (req, res) => {
  console.log('/api/remove-friend');

  const { currentUserID, friendToRemove } = req.body;
  const usersCollection = db.collection('users');

  const docRef = usersCollection.doc(currentUserID);
  const doc = await docRef.get();

  if (!doc.exists) return res.json({ result: 'Current user not found' });
  await docRef.update({
    friends: admin.firestore.FieldValue.arrayRemove(friendToRemove)
  });

  res.json({ result: `Friend removed: ${friendToRemove}` });
});

app.post('/api/fetch-friends', async (req, res) => {
  console.log('/api/fetch-friends');

  const { currentUserID } = req.body;
  const usersCollection = db.collection('users');

  const docRef = usersCollection.doc(currentUserID);
  const doc = await docRef.get();
  if (!doc.exists) res.json([]);
  res.json(doc.data().friends);
});



server.listen(process.env.PORT || 8080, () => {
  console.log('App listening on port 8080');
});


const lobbyPeople = {};
const parties = {};
const lobbyIO = io.of('/lobby');
lobbyIO.on('connection', onConnect);


function onConnect(socket) {
 
  // Emit join lobby event
  socket.emit('join');

  // Register socket to username
  socket.on('join', username => {
    socket.username = username;

    if (!lobbyPeople[username]) {
      lobbyPeople[username] = {
        username,
        sockets: { [socket.id]: true }
      };
    } else {
      lobbyPeople[username].sockets[socket.id] = true;
    }

    updatePeople();
  });

  // Update client count on disconnect
  socket.on('disconnect', () => {  
    const player = lobbyPeople[socket.username];
    if (!player) return console.log('No player found'); 
    const playerSocketKey = Object.keys(player.sockets).find(key => key === socket.id);
    delete player.sockets[playerSocketKey];

    // If player has no more open sockets then delete from lobbyPeople
    if (!Object.keys(player.sockets).length) {
      delete lobbyPeople[socket.username];
    }
    console.log(lobbyPeople)
    updatePeople();
  });

  // Invite friend
  socket.on('inviteFriend', friendToInvite => {
    console.log(`${socket.username} wants to invite ${friendToInvite}`);


    const recipientSockets = lobbyPeople[friendToInvite].sockets;
    Object.keys(recipientSockets).forEach(socketID => {
      lobbyIO.to(socketID).emit('inviteReceived', socket.username);
    });
  });

  // Accept invite
  socket.on('acceptInvite', inviter => {
    console.log(`${socket.username} accepted invite from ${inviter}`);
    lobbyPeople[inviter].partyLeader = true;

    const isNewParty = !parties[inviter];
    if (isNewParty) {
      parties[inviter] = [ lobbyPeople[inviter], lobbyPeople[socket.username] ];
    } else {
      const inPartyAlready = parties[inviter].find(member => member.username === socket.username);
      if (inPartyAlready) return console.log('inPartyAlready!');
       
      parties[inviter].push(lobbyPeople[socket.username]);
    }

    const partyNames = parties[inviter].map(member => member.username); 

    parties[inviter].forEach(member => {
      const memberSockets = lobbyPeople[member.username].sockets;
      Object.keys(memberSockets).forEach(socketID => {
        lobbyIO.to(socketID).emit('partyUpdated', partyNames);
      });
    });

    // TODO: 
    // Clear extra invites
    // Condition for full party
    // Prevent non-party leaders from inviting
  });
}


function updatePeople() {
  lobbyIO.emit('updatePeople', lobbyPeople);
}
