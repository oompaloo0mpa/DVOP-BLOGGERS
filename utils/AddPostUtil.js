const fs = require('fs').promises;
const path = require('path');

const FILE = path.join(__dirname, 'posts.json'); // WRITE TO posts.json

async function addPost(req, res) {
  try {
    const { title, content, owner, imageUrl } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'title and content required' });

    let existing = [];
    try {
      const raw = await fs.readFile(FILE, 'utf8');
      existing = raw ? JSON.parse(raw) : [];
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      existing = [];
    }

    const id = Date.now().toString();
    const newPost = {
      id,
      title,
      content,
      owner: owner || null,
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString()
    };

    existing.push(newPost);
    await fs.writeFile(FILE, JSON.stringify(existing, null, 2), 'utf8');

    return res.status(201).json(newPost);
  } catch (err) {
    console.error('addPost error', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { addPost };