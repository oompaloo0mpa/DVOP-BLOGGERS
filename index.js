var express = require('express');
var bodyParser = require("body-parser");
var path = require('path');
var app = express();
const PORT = process.env.PORT || 5050;
var startPage = "index.html";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("./public"));

// add post endpointz - matin
const { addPost } = require('./utils/AddPostUtil');
app.post('/add-post', addPost);

// serve the blogs.json so frontend can fetch it if needed - matin
app.get('/utils/blogs.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'utils', 'blogs.json'));
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/public/" + startPage);
});

server = app.listen(PORT, function () {
  const address = server.address();
  const baseUrl = `http://${address.address == "::" ? 'localhost' : address.address}:${address.port}`;
  console.log(`Demo project at: ${baseUrl}`);
});

module.exports = { app, server }