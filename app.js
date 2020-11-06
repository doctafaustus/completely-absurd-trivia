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
    res.json(doc.data());
  } else {
    const randomNum = Math.ceil(Math.random() * 1000);
    await docRef.set({
      email: authUser.email,
      username: `newbie_${randomNum}${(+new Date).toString(36)}`,
      created: new Date().getTime(),
      lastLoggedIn: new Date().getTime()
    });
    const updatedDoc = await docRef.get();
    res.json(updatedDoc.data());
  }
});


server.listen(process.env.PORT || 8080, () => {
  console.log('App listening on port 8080');
});


const lobbyPeople = {};
const users = [];
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
        partyLeader: false,
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

    updatePeople();
  });
}


function updatePeople() {
  lobbyIO.emit('updatePeople', lobbyPeople);
}
