const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(`${__dirname}/client/dist`));

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/client/dist/index.html`);
});

server.listen(process.env.PORT || 8080, () => {
  console.log('App listening on port 8080');
});


io.on('connection', socket => {
  console.log('hello');
});
