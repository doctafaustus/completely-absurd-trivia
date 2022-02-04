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

app.use(serveStatic(__dirname + '/client/dist', {
  index: false
}));
// app.use(express.static(`${__dirname}/client/dist`));

app.use(bodyParser.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(csurf({ cookie: true }));
app.all('*', (req, res, next) => {
  console.log('---', req.url);
  res.cookie('XSRF-TOKEN', req.csrfToken());
  next();
});



app.post('/session-login', async (req, res) => {
  const idToken = req.body.idToken.toString();
  const expiresIn = 60 * 60 * 24 * 7 * 1000;

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
      friendCode: (Math.random() * 100000).toFixed(0).padEnd(5, 0)
    });
    const updatedDoc = await docRef.get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  }
});


app.post('/api/add-friend', async (req, res) => {
  console.log('/api/add-friend');

  const { currentUserID, currentUserName, friendToAdd, friendCode } = req.body;
  const usersCollection = db.collection('users');

  const docRef = usersCollection.doc(currentUserID);
  const doc = await docRef.get();

  if (currentUserName === friendToAdd) return res.json({ result: 'You can\'t add yourself as a freind!' });
  if (!doc.exists) return res.json({ result: 'Current user not found' });

  // Check if friendToAdd exists
  const query = await usersCollection.where('username', '=', friendToAdd)
  query.get().then(async (querySnapshot) => {
    let friendDocID;

    const result = querySnapshot.docs.map(doc => {
      const { username, friendCode } = doc.data();
      friendDocID = doc.id;

      return { username, friendCode};
    });
    
    const [firstResult] = result;

    if (firstResult) {
      if (friendCode !== firstResult.friendCode) {
        return res.json({ result: 'Invalid friend code' });
      }
      await docRef.update({
        friends: admin.firestore.FieldValue.arrayUnion(db.doc(`users/${friendDocID}`))
      });

      const friendDocRef = usersCollection.doc(friendDocID);
      await friendDocRef.update({
        friends: admin.firestore.FieldValue.arrayUnion(db.doc(`users/${currentUserID}`))
      });

      res.json({ result: `Friend added: ${friendToAdd}` });
    } else {
      res.json({ result: 'Player not found' });
    }
  })
  .catch(error => {
    console.log(`Error getting documents: ${error}`);
    res.json([]);
  });
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

  const friendRefs = doc.data().friends;
  const friendDataPromises = friendRefs.map(async (friendRef) => {
    const friendDoc = await friendRef.get();
    return {
      id: friendDoc.id,
      username: friendDoc.data().username
    };
  });
  const results = await Promise.all(friendDataPromises);

  if (!doc.exists) res.json([]);
  res.json(results);
});


app.get('/log-out', (req, res) => {
  console.log('--/logout');
  res.clearCookie('session');
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
