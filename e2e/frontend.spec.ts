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
test.describe('Resource Mgmt CRUD Frontend Tests', () => {
  test('Create Post', async ({ request, browserName }) => {
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

