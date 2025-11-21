const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5050;
const startPage = 'index.html';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// CHANGED: USE ABSOLUTE STATIC PATH FOR RELIABILITY
app.use(express.static(path.join(__dirname, 'public')));

// MULTER IMAGE UPLOAD SETUP
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

// upload endpoint to accept form-data with 'image' field
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const publicPath = `/uploads/images/${req.file.filename}`;
  return res.status(201).json({ imageUrl: publicPath });
});

// FEATURE ENDPOINTS
const { addPost } = require('./utils/MatinUtil');
const { viewPost } = require('./utils/ViewPostUtil');

app.post('/add-post', addPost);
app.get('/posts/:id', viewPost);

// Serve JSON files to frontend
app.get('/utils/posts.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'utils', 'posts.json'));
});
// CHANGED: RETURN THE CORRECT FILE FOR blogs.json
app.get('/utils/blogs.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'utils', 'blogs.json'));
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', startPage));
});

// CHANGED: SINGLE LISTEN CALL; USE this.address() INSIDE CALLBACK TO AVOID UNDEFINED server
const server = app.listen(PORT, function () {
  const address = this.address();
  const host = (address.address === '::') ? 'localhost' : address.address;
  const baseUrl = `http://${host}:${address.port}`;
  console.log(`Demo project at: ${baseUrl}`);
});

module.exports = { app, server };