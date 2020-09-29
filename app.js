const express = require('express');


const app = express();
app.use(express.static(`${__dirname}/client/dist`));

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/client/dist/index.html`);
});

app.listen(process.env.PORT || 8080, () => {
  console.log('App listening on port 8080');
});
