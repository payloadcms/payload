var mongoose = require('mongoose');
var express = require('express');

mongoose.connect('mongodb://localhost/payload-demo');

var app = module.exports = express();
var port = 3000;

app.get('/test', (req, res) => {
  res.sendStatus(200);
});

require('./api');

app.listen(port, (error) => {
  console.log("listening on " + port + "...");
})
