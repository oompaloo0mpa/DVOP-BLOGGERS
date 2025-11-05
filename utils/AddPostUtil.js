const { BlogPost } = require('../models/Posts');
const fs = require('fs').promises; 
const path = require('path');
const POSTS_FILE = path.join('utils', 'blogs.json'); 
const TEMPLATE_FILE = path.join('utils', 'blogs.template.json'); 

async function addPost(req, res) { 
    try {
        const { title, content, imageUrl, owner } = req.body; // all the post fields - matin
        const newPost = new BlogPost(title, content, imageUrl, owner); // new blog post - matin

        let posts = []; //holds current posts in the template.json - matin
        try { 
            const data = await fs.readFile(POSTS_FILE, 'utf8'); // read posts.json as text - matin
            posts = JSON.parse(data); // parse JSON into array- matin
        } catch (err) { //  error handling - matin
            if (err.code === 'ENOENT') { 
                const templateData = await fs.readFile(TEMPLATE_FILE, 'utf8'); 
                posts = JSON.parse(templateData); 
                await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
            } else { // also error handling- matin
                throw err;
            } 
        }

        posts.push(newPost); // new post to list - matin
        await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8'); // save updated posts list - matin

        return res.status(201).json(posts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

module.exports = { addPost };