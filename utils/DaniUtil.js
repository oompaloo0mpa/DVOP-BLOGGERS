const fs = require('fs').promises;
const path = require('path');
const POSTS_FILE = path.join('utils', 'posts.json');
async function editPost(req, res) {
    try {
        const { id } = req.params; // Get the id from the URL
        console.log('Post ID:', id, 'id type:', typeof id);

        // If no id is provided, return error
        if (!id) {
            return res.status(400).json({ message: 'No Post ID provided' });
        }

        const searchId = String(id).trim();

        const { title, content, imageUrl } = req.body; // Get updated data from request body

        // If no fields to update are provided, return error
        if (!title && !content && !imageUrl) {
            return res.status(400).json({
                message: 'At least one field must be provided to update.'
            });
        }

        let posts = []; //holds current posts in the posts.json
        try {
            const data = await fs.readFile(POSTS_FILE, 'utf8'); // read posts.json as text
            try {
                posts = JSON.parse(data);
            } catch (parseError) {
                // Handle JSON parse error
                console.error('JSON parse error:', parseError);
                return res.status(500).json({
                    message: 'Posts file contains invalid JSON data.',
                    error: parseError.message
                });
            }
        } catch (err) {
            // If file doesn't exist, returns error message
            if (err.code === 'ENOENT') {
                return res.status(404).json({ message: 'No blog posts found to edit.' });
            } else {
                throw err;
            }
        }

        // Find the post by ID, return 404 if not found
        const postId = posts.findIndex(p => String(p.id).trim() == id);
        if (postId === -1) {
            return res.status(404).json({ message: 'Post with ID (' + id + ') not found.' });
        }

        console.log('Editing post:', posts[postId]);
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
        try {
            await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
        } catch (writeError) {
            // Handle write error
            console.error('Failed to save updated post:', writeError);
            return res.status(500).json({
                message: 'Post was updated but failed to save. Please try again.',
                error: writeError.message
            });
        }

        return res.status(200).json({
            message: 'Resource updated successfully!',
            resource: posts[postId]
        });
    } catch (error) {
        // Handle unexpected errors
        console.error('Unexpected error in editPost:', error);
        return res.status(500).json({
            message: 'An unexpected error occurred while updating the post.',
            error: error.message
        });
    }
}
module.exports = { editPost };