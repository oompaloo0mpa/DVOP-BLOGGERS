process.env.COVER_INDEX = '1';
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { app, startServer, reportAddressInfo } = require('../index');

// Do not start a real server here; use `app` with supertest to avoid port conflicts

test('GET / serves index.html', async () => {
  const res = await request(app).get('/');
  expect(res.status).toBe(200);
  expect(res.text).toMatch(/<!doctype html>|<html/i);
});

test('reportAddressInfo handles missing and IPv6 address', () => {
  // no address
  const r1 = reportAddressInfo(undefined);
  expect(r1).toBeNull();

  // IPv6 address maps to localhost
  const r2 = reportAddressInfo({ address: '::', port: 5050 });
  expect(r2).toBe('http://localhost:5050');

  // IPv4 address returned as-is
  const r3 = reportAddressInfo({ address: '127.0.0.1', port: 5050 });
  expect(r3).toBe('http://127.0.0.1:5050');
});

test('GET /utils/posts.json returns JSON', async () => {
  const res = await request(app).get('/utils/posts.json');
  expect(res.status).toBe(200);
  expect(res.type).toMatch(/json/);
});

test('GET /utils/blogs.json returns JSON', async () => {
  const res = await request(app).get('/utils/blogs.json');
  expect(res.status).toBe(200);
  expect(res.type).toMatch(/json/);
});

test('POST /upload without file returns 400', async () => {
  const res = await request(app).post('/upload');
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty('message', 'No file uploaded');
});

test('POST /upload with file returns 201 and imageUrl', async () => {
  const imgBuf = Buffer.from('this is a fake image');
  const res = await request(app)
    .post('/upload')
    .attach('image', imgBuf, 'fake.png');

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('imageUrl');

  // cleanup created file
  const uploadedPath = path.join(__dirname, '..', 'public', res.body.imageUrl);
  try {
    if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
  } catch (e) {
    // ignore
  }
});
