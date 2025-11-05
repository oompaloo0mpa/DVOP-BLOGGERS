class BlogPost {
    constructor(title, content, imageUrl, owner) { 
        this.title = title; // save the post title  - matin
        this.content = content; // saves content - matin
        this.imageUrl = imageUrl; // save the image - matin
        this.owner = owner; // save whoever made za post - matin

        
        const timestamp = Date.now(); // gets current time of post - matin
        const random = Math.floor(Math.random() * 1000); // id for uniqueness - matin
        this.id = `${timestamp}${random.toString().padStart(3, '0')}`; // build unique id - matin
        this.createdAt = new Date().toISOString(); // record creation time in ISO (not impt for other features prob)- matin
    } 
}

module.exports = { BlogPost };