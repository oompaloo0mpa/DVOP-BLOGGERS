var express = require('express');
var bodyParser = require("body-parser");
var path = require('path');
var app = express();
const PORT = process.env.PORT || 5050;
var startPage = "index.html";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("./public"));


//## ALL THIS STUFF HERE IS THE NEW IMAGE SHIT. TRY NOT TO CHANGE THIS PART. ALSO NPM INSTALL MULTER PLZZZ - matin**
// multer to allow file uploading
const fs = require('fs');
const multer = require('multer');
// ensure upload dir exists
const uploadDir = path.join(__dirname, 'public', 'uploads', 'images');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.floor(Math.random() * 1e6) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

// upload endpoint to acceptsform-data with 'image' field - matinz
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const publicPath = `/uploads/images/${req.file.filename}`;
  return res.status(201).json({ imageUrl: publicPath });
});


//## ALL THIS STUFF HERE IS JS I COPY OF LABSHEETS - matinz

//all the feature endpoints go here - matin
const { addPost } = require('./utils/AddPostUtil');
app.post('/add-post', addPost);

// serve the posts.json for frontend to fetch - matinz
app.get('/utils/posts.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'utils', 'posts.json'));
});
app.get('/utils/blogs.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'utils', 'posts.json'));
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