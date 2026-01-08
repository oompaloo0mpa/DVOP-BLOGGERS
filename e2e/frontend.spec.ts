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
      content: 'created by playwright e2e test',
      imageUrl: '/uploads/images/e2e.png',
      owner: 'e2e@example.com'
    };

    const res = await request.post(`${BASE_URL}/add-post`, { data: newPost }); // post to add-post endpoint
    expect(res.status()).toBe(201); // expect created
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true); // should return array of posts
    expect(body.some((p: any) => p.title === newPost.title)).toBeTruthy(); // new post present
  });
});

test.describe('create post ui test', () => { // describe block for create-only ui test - matin
  test('creates a blog post via ui', async ({ page, browserName }) => { // single test: create post only - matin
    await page.goto(BASE_URL); // navigate to the homepage where the add form lives - matin
    const postTitle = `e2e ui post - ${browserName}`; // compose a unique title per browser run - matin

    await page.click('#openAddBtn'); // open the add-post modal using the floating button - matin
    await page.waitForSelector('#title', { state: 'visible', timeout: 5000 }); // wait until the title input is visible - matin

    await page.fill('#title', postTitle); // fill the title input with our generated title - matin
    await page.fill('#content', 'created by playwright ui test'); // fill the content textarea with sample content - matin
    await page.fill('#owner', 'ui@example.com'); // fill the owner/email input with a valid email - matin

    const imageInput = await page.$('#imageInput'); // check if the optional image file input exists - matin
    if (imageInput) { // only attempt upload if the input is present - matin
      try {
        // attach a small empty file to simulate an image upload; name and mime are provided - matin
        await imageInput.setInputFiles({ name: 'placeholder.png', mimeType: 'image/png', buffer: Buffer.from([137,80,78,71]) }); // set a tiny png-like buffer - matin
      } catch (e) {
        // if upload fails, continue without failing the whole test - matin
      }
    }

    await page.click('#modalAdd'); // click the modal add button to submit the new post - matin

    await page.waitForSelector('#notif', { state: 'visible', timeout: 10000 }); // wait for the notification that indicates success - matin
    const notifText = await page.locator('#notif').innerText(); // read the notification text - matin
    expect(notifText.toLowerCase()).toContain('post added'); // assert success message shown (lowercased for robustness) - matin

    const row = page.locator('#posts h2.title', { hasText: postTitle }); // locate the newly created post by title in the posts grid - matin
    await row.waitFor({ state: 'visible', timeout: 10000 }); // wait until the new post becomes visible in the list - matin
    await expect(row).toBeVisible(); // final assertion: the created post is visible on the page - matin
  });
});