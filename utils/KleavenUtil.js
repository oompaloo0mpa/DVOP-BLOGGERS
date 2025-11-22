const fs = require('fs');
const path = require('path');

// ============================================
// ✨ RETRIEVE (READ) FUNCTION - View Single Post
// ============================================
function viewPost(req, res) {
  try {
    const postId = req.params.id;

    // ERROR HANDLING #1: Invalid Post ID (400)
    // Check if ID is valid (allow large numeric strings for timestamp-based IDs)
    if (!postId || postId.trim() === '' || !/^\d+$/.test(postId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid post ID. ID must be a positive integer.',
        code: 'INVALID_ID'
      });
    }
    
    // Keep ID as string to handle large timestamp IDs safely
    const id = postId;

    // ERROR HANDLING #3: File Read Error (500)
    // Try to read the posts.json file
    let posts;
    try {
      const postsPath = path.join(__dirname, 'posts.json');
      const data = fs.readFileSync(postsPath, 'utf8');
      posts = JSON.parse(data);
    } catch (fileError) {
      console.error('File read error:', fileError);
      return res.status(500).json({
        success: false,
        error: 'Unable to read posts data. Please try again later.',
        code: 'FILE_READ_ERROR'
      });
    }

    // ERROR HANDLING #2: Post Not Found (404)
    // Search for the post with matching ID (compare as strings for large timestamp IDs)
    const post = posts.find(p => String(p.id) === String(id));
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: `Post with ID ${id} not found.`,
        code: 'POST_NOT_FOUND'
      });
    }

    // Success: Return the post
    res.status(200).json({
      success: true,
      post: post
    });

  } catch (error) {
    // ERROR HANDLING #4: Unexpected Server Error (500)
    console.error('Unexpected error in GET /posts/:id:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again later.',
      code: 'UNEXPECTED_ERROR'
    });
  }
}

module.exports = { viewPost };