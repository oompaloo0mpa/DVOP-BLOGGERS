const request = require('supertest');
const { app, server } = require('../index');
// Close server after all tests complete
afterAll(() => server.close());
describe('Add Post API', () => { // api tests grouped here
        let resourceId; // variable to store created resource id

        it('POST /add-post should create a post', async () => {
            const newPost = { title: 'api title', content: 'api content', imageUrl: 'img.png', owner: 'api@me' }; // post payload

            const res = await request(app).post('/add-post').send(newPost); // send api request to add-post

            expect(res.status).toBe(201); // expect created status
            expect(res.body.some(r => r.title === newPost.title)).toBe(true); // expect returned list contains the new post
            resourceId = res.body[res.body.length - 1].id; // store the id of the newly created post
        });

        afterAll(() => server.close()); // close the server after api tests finish
    });