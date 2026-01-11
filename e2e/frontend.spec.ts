import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import config from '../playwright.config';
const BASE_URL = 'http://localhost:5050';
const POSTS_FILE = path.join(__dirname, '../utils/posts.json');
test.beforeAll(async () => {
  const projects: { name: string }[] = (config as any).projects ?? [];
  const browsers: string[] = projects.map(p => p.name);
  // prepare initial posts.json used by the server during tests
  const initialData = browsers.flatMap((browserName: string) => [
    {
      id: `p-${browserName}-1`,
      title: `sample post 1 - ${browserName}`,
      content: 'sample content 1',
      imageUrl: '/uploads/images/sample1.png',
      owner: 'admin@example.com',
      createdAt: new Date().toISOString()
    },
    {
      id: `p-${browserName}-2`,
      title: `sample post 2 - ${browserName}`,
      content: 'sample content 2',
      imageUrl: '/uploads/images/sample2.png',
      owner: 'admin@example.com',
      createdAt: new Date().toISOString()
    }
  ]);
  await fs.writeFile(POSTS_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  console.log('posts.json initialized for browsers:', browsers.join(', '));
});
test.describe('posts frontend e2e', () => {
  test('create post', async ({ request, browserName }) => {
    // create a new post via api and verify it exists in the returned list
    const newPost = {
      title: `e2e post - ${browserName}`,
      content: 'a short e2e blog post demonstrating the add-post flow',
      imageUrl: '/uploads/images/e2e.png',
      owner: 'e2e.author@example.com'
    };

    const res = await request.post(`${BASE_URL}/add-post`, { data: newPost }); // post to add-post endpoint
    expect(res.status()).toBe(201); // expect created
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true); // should return array of posts
    expect(body.some((p: any) => p.title === newPost.title)).toBeTruthy(); // new post present
  });
});

test.describe('Resource Mgmt CRUD Frontend Tests', () => {
  test('Create Resource', async ({ page, browserName }) => {
    await page.goto(BASE_URL); // navigate to homepage
    const uniqueId = Date.now(); // unique timestamp to avoid duplicate title collisions
    const postTitle = `A Portable Projector Review - ${browserName}-${uniqueId}`; // use unique, blog-like title

    // open modal
    await page.click('#openAddBtn'); // click the add post floating button

    // fill form
    await page.fill('#title', postTitle); // title field
    await page.fill('#content', 'a brief review and first impressions of a portable projector for home cinema and presentations.'); // blogpost-style content
    await page.fill('#owner', 'coolbeanstest@example.com'); // author email (keeps validation happy :D)

    // attach a tiny image to exercise the upload flow
    await page.setInputFiles('#imageInput', { name: 'e2e.png', mimeType: 'image/png', buffer: Buffer.from([137,80,78,71]) }); // attach tiny png

    // submit the new post
    const [uploadResp, addResp] = await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/upload') && r.status() === 201, { timeout: 10000 }), // wait for upload
      page.waitForResponse(r => r.url().endsWith('/add-post') && r.status() === 201, { timeout: 10000 }), // wait for add-post
      page.click('#modalAdd') // click add post button
    ]);

    // wait for modal to close
    await page.waitForSelector('#modalBackdrop', { state: 'hidden', timeout: 10000 }); // wait until modal backdrop hidden

    // wait for the new post to appear in the posts grid
    const row = page.locator('#posts h2.title', { hasText: postTitle }).first(); // locate the post title (use first to avoid strict mode)
    await row.waitFor({ state: 'visible', timeout: 10000 }); // wait for visibility

    // assert it is visible
    await expect(row).toBeVisible();
  });
});