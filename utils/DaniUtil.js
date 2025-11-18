const fs = require('fs').promises;
const path = require('path');
const POSTS_FILE = path.join('utils', 'posts.json');
async function editPost(req, res) {
    try {
        const { id } = req.params; // Get the id from the URL
        const { title, content, imageUrl } = req.body; // Get updated data from request body
        let posts = []; //holds current posts in the posts.json
        try {
            const data = await fs.readFile(POSTS_FILE, 'utf8'); // read posts.json as text
            posts = JSON.parse(data); 
        } catch (err) {
            // If file doesn't exist, returns error message
            if (err.code === 'ENOENT') {
                return res.status(404).json({ message: 'No blog posts found to edit.' });
            } else {
                throw err;
            }
        }

        // Find the post by ID, return 404 if not found
        const postId = posts.findIndex(p => p.id == id);
        if (postId === -1) {
            return res.status(404).json({ message: 'Post not found.' });
        }
        // Update post fields
        // gets fields from request body and updates only those that are provided
        // if a field is not provided, it keeps its original value 
        posts[postId] = {
            ...posts[postId],
            title: title || posts[postId].title,
            content: content || posts[postId].content,
            imageUrl: imageUrl || posts[postId].imageUrl,
        };

        // Write the updated posts array back to posts.json
        // Return success response with the updated post
        await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
        return res.status(200).json({
            message: 'Resource updated successfully!',
            resource: posts[postId]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}
module.exports = { editPost };