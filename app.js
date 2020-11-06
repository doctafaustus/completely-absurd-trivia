const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const { resolve } = require('path');
const { auth } = require('firebase-admin');

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

app.get('/game', (req, res) => {
  res.sendFile(`${__dirname}/client/dist/game.html`);
});

app.post('/api/create-user', async (req, res) => {
  console.log('/api/create-user');

  const { authUser } = req.body;
  console.log('authUser', authUser);

  const usersCollection = db.collection('users');
  const docRef = usersCollection.doc(authUser.uid);
  
  const doc = await docRef.get();
  if (doc.exists) {
    docRef.update({ lastLoggedIn: new Date().getTime() });
  } else {
    const randomNum = Math.ceil(Math.random() * 1000);
    await docRef.set({
      email: authUser.email,
      username: `newbie_${randomNum}${(+new Date).toString(36)}`,
      created: new Date().getTime(),
      lastLoggedIn: new Date().getTime()
    });
  }

  console.log('done');
  res.json({ done: true });
});


server.listen(process.env.PORT || 8080, () => {
  console.log('App listening on port 8080');
});


io.on('connection', socket => {
  console.log('hello');
});
