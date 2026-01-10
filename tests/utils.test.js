// Mock the 'fs' module so we don't interact with the real file system.
// Instead, we simulate how readFile, writeFile and rename should behave.
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        rename: jest.fn(),
    }, mkdirSync: jest.fn(), // mock mkdirSync used by index.js to create upload dir
}));

const fs = require('fs').promises;
const { addPost } = require('../utils/MatinUtil');

const request = require('supertest'); // supertest for api-style requests
const { app, server } = require('../index'); // import express app and server for api tests

describe('Unit Tests for Utils', () => {
    // Reset mocks before each test to avoid "leaking" state between tests
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('addPost should add a post when posts.json exists', async () => {
        const existing = [ { id: '1', title: 'old', content: 'old content' } ];
        fs.readFile.mockResolvedValue(JSON.stringify(existing));
        fs.writeFile.mockResolvedValue();

        const req = { body: { title: 'new title', content: 'new content', imageUrl: 'img.png', owner: 'author' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await addPost(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalled();

        // Ensure writeFile was called with JSON containing the new post appended
        expect(fs.writeFile).toHaveBeenCalled();
        const written = JSON.parse(fs.writeFile.mock.calls[fs.writeFile.mock.calls.length - 1][1]);
        expect(written.length).toBe(existing.length + 1);
        const added = written[written.length - 1];
        expect(added.title).toBe(req.body.title);
        expect(added.content).toBe(req.body.content);
        expect(added.imageUrl).toBe(req.body.imageUrl);
        expect(added.owner).toBe(req.body.owner);
        expect(added).toHaveProperty('id');
        expect(added).toHaveProperty('createdAt');
    });

    it('addPost should initialize from template when posts.json is missing', async () => {
        // simulate missing posts.json by rejecting first read with ENOENT on the same line
        fs.readFile.mockImplementationOnce(() => { const e = new Error('no file'); e.code = 'ENOENT'; return Promise.reject(e); }); // simulate missing posts file
        const template = [ { id: 't0', title: 'template', content: 'templ' } ];
        fs.readFile.mockResolvedValueOnce(JSON.stringify(template)); // return template.json on next read
        fs.writeFile.mockResolvedValue(); // make writes succeed

        const req = { body: { title: 'from template', content: 'content', imageUrl: 'img.png', owner: 'author' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await addPost(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalled();
        expect(fs.rename).not.toHaveBeenCalled(); // no rename should occur for ENOENT case
        // final write should include the template items + the new one
        const final = JSON.parse(fs.writeFile.mock.calls[fs.writeFile.mock.calls.length - 1][1]);
        expect(final.length).toBe(template.length + 1);
    });

    it('addPost should recover from corrupt posts.json by renaming and using template', async () => {
        fs.readFile.mockResolvedValueOnce('not a json'); // simulate corrupt posts.json
        fs.rename.mockResolvedValue(); // allow rename to succeed
        const template = [ { id: 't1', title: 'template2', content: 'templ2' } ];
        fs.readFile.mockResolvedValueOnce(JSON.stringify(template)); // return template after rename
        fs.writeFile.mockResolvedValue(); // make writes succeed

        const req = { body: { title: 'recovered post', content: 'recovered', imageUrl: 'i.png', owner: 'me' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await addPost(req, res);

        expect(fs.rename).toHaveBeenCalled(); // corrupt file should be renamed
        expect(res.status).toHaveBeenCalledWith(201);
        const final = JSON.parse(fs.writeFile.mock.calls[fs.writeFile.mock.calls.length - 1][1]);
        expect(final.length).toBe(template.length + 1); // template plus new post
    });

    it('addPost should return 400 when required fields missing', async () => {
        const req = { body: { content: 'missing title' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await addPost(req, res);

        expect(res.status).toHaveBeenCalledWith(400); // validation should trigger 400
        expect(fs.writeFile).not.toHaveBeenCalled(); // no writes when validation fails
    });

    it('addPost should return 500 when non-ENOENT read error occurs', async () => {
        // Simulate a permission error or other non-ENOENT error
        const permissionError = new Error('EACCES: permission denied');
        permissionError.code = 'EACCES';
        fs.readFile.mockRejectedValueOnce(permissionError);

        const req = { body: { title: 'test', content: 'test content' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await addPost(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: permissionError.message });
    });

    it('addPost should handle rename failure gracefully during corrupt file recovery', async () => {
        fs.readFile.mockResolvedValueOnce('not valid json'); // corrupt posts.json
        fs.rename.mockRejectedValueOnce(new Error('rename failed')); // rename fails
        const template = [{ id: 't2', title: 'template3', content: 'templ3' }];
        fs.readFile.mockResolvedValueOnce(JSON.stringify(template)); // template read succeeds
        fs.writeFile.mockResolvedValue();

        const req = { body: { title: 'rename fail post', content: 'content', imageUrl: 'x.png', owner: 'owner' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await addPost(req, res);

        // Should still succeed despite rename failure
        expect(res.status).toHaveBeenCalledWith(201);
        const final = JSON.parse(fs.writeFile.mock.calls[fs.writeFile.mock.calls.length - 1][1]);
        expect(final.length).toBe(template.length + 1);
    });

    it('addPost should return 500 when writeFile fails', async () => {
        const existing = [{ id: '1', title: 'old', content: 'old' }];
        fs.readFile.mockResolvedValue(JSON.stringify(existing));
        fs.writeFile.mockRejectedValueOnce(new Error('disk full'));

        const req = { body: { title: 'write fail', content: 'content' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await addPost(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'disk full' });
    });

    afterAll(() => { if (server && server.close) server.close(); }); // ensure server closed to avoid logs after tests finish
});