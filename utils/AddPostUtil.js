const fs = require('fs').promises;
const path = require('path');

const FILE = path.join(__dirname, 'resources.json'); // RESOLVE RELATIVE TO THIS MODULE

async function addPost(req, res) {
  try {
    // Accept JSON body (client must send JSON)
    const { title, content, owner, imageUrl } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'title and content required' });

    // Read existing file or start with empty array
    let existing = [];
    try {
      const raw = await fs.readFile(FILE, 'utf8');
      existing = raw ? JSON.parse(raw) : [];
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    const id = Date.now().toString();
    const newPost = {
      id,
      title,
      content,
      owner: owner || null,
      imageUrl: imageUrl || null,
      date: new Date().toISOString()
    };

    existing.push(newPost);
    await fs.writeFile(FILE, JSON.stringify(existing, null, 2), 'utf8');

    // Return created resource
    return res.status(201).json(newPost);
  } catch (err) {
    console.error('addPost error', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { addPost };