const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const serveStatic = require('serve-static');

// Cloudstore config
let serviceAccount = process.env.SERVICE_ACCOUNT_KEY;
if (!process.env.PORT) serviceAccount = require('./private/serviceAccountKey.json');
else serviceAccount = JSON.parse(serviceAccount);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Check if the static directory was preventing cookies from getting set when using Vite

app.use(serveStatic(`${__dirname}/client/dist`, {
  index: false
}));
app.use(serveStatic(`${__dirname}/client/public`));
// app.use(express.static(`${__dirname}/client/dist`));

app.use(bodyParser.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(csurf({ cookie: true }));
app.all('*', (req, res, next) => {
  console.log('---', req.url);
  res.cookie('XSRF-TOKEN', req.csrfToken());
  next();
});

const expiresIn = 60 * 60 * 24 * 7 * 1000;

app.post('/session-login', async (req, res) => {
  const idToken = req.body.idToken.toString();

  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    const options = { maxAge: expiresIn, httpOnly: true };
    res.cookie('session', sessionCookie, options);

    res.end(JSON.stringify({ status: 'success' }));
  } catch(errorInfo) {
    console.error(errorInfo.message);
    res.status(401).send('Unauthorized request')
  }
});


app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/client/dist/index.html`);
});


async function isLoggedIn(req, res, next) {
  try {
    const sessionCookie = req.cookies.session || '';
    await admin.auth().verifySessionCookie(sessionCookie, true);
    next();
  } catch(errorInfo) {
    res.redirect('/not-logged-in');
  }
}

app.get('/lobby', isLoggedIn, (req, res) => {
  res.sendFile(`${__dirname}/client/dist/lobby/index.html`);
});

app.get('/game', (req, res) => {
  res.sendFile(`${__dirname}/client/dist/game/index.html`);
});

app.post('/add-if-new', async (req, res) => {
  const { authUser } = req.body;
  const usersCollection = db.collection('users');
  const docRef = usersCollection.doc(authUser.uid);
  
  const doc = await docRef.get();
  res.cookie('userID', doc.id, { maxAge: expiresIn, httpOnly: true });

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
      lastLoggedIn: new Date().getTime(),
      friendCode: (Math.random() * 10000).toFixed(0).padEnd(4, 0)
    });
    const updatedDoc = await docRef.get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  }
});


app.post('/add-friend', async (req, res) => {
  try {
    const currentUserID = req.cookies.userID;
    if (!currentUserID) return res.json({ result: 'Current user not logged in' });

    const { friendToAdd, friendCode } = req.body;
    const usersCollection = db.collection('users');

    const docRef = usersCollection.doc(currentUserID);
    const doc = await docRef.get();

    if (!doc.exists) return res.json({ result: 'Current user not found' });

    // Check if friendToAdd exists
    const query = await usersCollection.where('username', '=', friendToAdd);
    const querySnapshot = await query.get();

    let friendDocID;

    const result = querySnapshot.docs.map(doc => {
      const { username, friendCode } = doc.data();
      friendDocID = doc.id;

      return { username, friendCode};
    });
    
    const [firstResult] = result;

    if (!firstResult) return res.json({ result: 'Player not found' });
    if (friendDocID === currentUserID) {
      return res.json({ result: 'You can\'t add yourself as a friend!' });
    }
    if (friendCode !== firstResult.friendCode) {
      return res.json({ result: 'Invalid friend code' });
    }
    
    await docRef.update({
      friends: admin.firestore.FieldValue.arrayUnion(friendDocID)
    });

    const friendDocRef = usersCollection.doc(friendDocID);
    await friendDocRef.update({
      friends: admin.firestore.FieldValue.arrayUnion(currentUserID)
    });

    res.json({ result: `Friend added: ${friendToAdd}` });
  } catch(err) {
    console.log(`/add-friend error: ${err}`);
    res.json({ result: 'Could not add friend' });
  }
});

app.post('/remove-friend', async (req, res) => {
  try {
    const currentUserID = req.cookies.userID;
    if (!currentUserID) return res.json({ result: 'Current user not logged in' });
  
    const { friendToRemoveID } = req.body;
    const usersCollection = db.collection('users');
  
    const docRef = usersCollection.doc(currentUserID);
    const doc = await docRef.get();
  
    if (!doc.exists) return res.json({ result: 'Current user not found' });
    await docRef.update({
      friends: admin.firestore.FieldValue.arrayRemove(friendToRemoveID)
    });

    const friendDocRef = usersCollection.doc(friendToRemoveID);
    await friendDocRef.update({
      friends: admin.firestore.FieldValue.arrayRemove(currentUserID)
    });

    res.json({ result: `Friend removed: ${friendToRemoveID}` });
  } catch(err) {
    console.log(`/remove-friend error: ${err}`);
    res.json({ result: 'Could not remove friend' });
  }
});

app.post('/fetch-friends', isLoggedIn, async (req, res) => {
  try {
    const currentUserID = req.cookies.userID;
    const usersCollection = db.collection('users');
  
    const docRef = usersCollection.doc(currentUserID);
    const doc = await docRef.get();
  
    const friendIDArr = doc.data().friends;
    if (friendIDArr.length === 0) return res.json([]);

    const friendRefs = friendIDArr.map(friendID => usersCollection.doc(friendID));

    const friends = await db.getAll(...friendRefs);
    const results = friends.map(doc => {
      return {
        id: doc.id,
        username: doc.data().username
      }
    });

    res.json(results);
  } catch(err) {
    console.log(`/fetch-friend error: ${err}`);
    res.json([]);
  }
});


app.get('/log-out', (req, res) => {
  console.log('--/logout');
  res.clearCookie('session');
  res.clearCookie('userID');
  res.redirect('/');
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

    const playerObj = lobbyPeople[friendToInvite];
    // TODO: Add handling for player not online
    if (!playerObj) return console.log('Player not online');

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
