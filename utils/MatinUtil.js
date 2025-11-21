const { BlogPost } = require('../models/Posts');
const fs = require('fs').promises; 
const path = require('path');
// Write posts to `utils/posts.json` so the existing file is updated
const POSTS_FILE = path.join('utils', 'posts.json'); 
const TEMPLATE_FILE = path.join('utils', 'blogs.template.json'); 

async function addPost(req, res) { 
    try {
        const { title, content, imageUrl, owner } = req.body; // all the post fields - matin
        // ERROR HANDLING BACKEND (1), VALIDATION: ensures all za needed fields are there .Return 400 if missing so user knows it's bad input - matin
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }
        const newPost = new BlogPost(title, content, imageUrl, owner); // new blog post - matin

        let posts = []; //holds current posts in the template.json - matin
        // ERROR HANDLING BACKEND (2) READ-MISSING: try to read `posts.json`. If missing, its initializes from template below - matin
        try {
            const data = await fs.readFile(POSTS_FILE, 'utf8'); // read posts.json as text - matin
            try {
                posts = JSON.parse(data); // parse JSON into array - matin
            } catch (parseErr) {
                // ERROR HANDLING BACKEND (3) CORRUPT-JSON:if posts.json contains invalid JSON, move corrupt file aside and re-create from the template- matin
                const corruptPath = POSTS_FILE + '.corrupt.' + Date.now();
                try { await fs.rename(POSTS_FILE, corruptPath); } catch(e) { /* ignore rename errors */ }
                const templateData = await fs.readFile(TEMPLATE_FILE, 'utf8');
                posts = JSON.parse(templateData);
                await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
            }
        } catch (err) { //  error handling - matin
            if (err.code === 'ENOENT') {
                const templateData = await fs.readFile(TEMPLATE_FILE, 'utf8');
                posts = JSON.parse(templateData);
                await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
            } else {
                throw err;
            }
        }

        posts.push(newPost); // new post to list - matin
        await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8'); // save updated posts list - matin

        return res.status(201).json(posts);
    } catch (error) {
        // ERROR HANDLING BACKEND (4) CATCH-ALL: usual catch, log & return HTTP 500 so user knows whats wrongz - matin
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

module.exports = { addPost };