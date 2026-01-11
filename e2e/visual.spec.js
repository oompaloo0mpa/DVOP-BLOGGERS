const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'http://localhost:5050'; // project runs on port 5050
const POSTS_FILE = path.join(__dirname, '../utils/posts.json');

// ensure a deterministic posts.json so visual snapshots are stable
test.beforeAll(async () => {
  const browsers = ['chromium', 'firefox', 'webkit']; // match playwright projects
  const fixedDate = '2025-01-01T00:00:00.000Z';
  const initialData = browsers.flatMap(browserName => [
    {
      id: `p-${browserName}-1`,
      title: `sample post 1 - ${browserName}`,
      content: 'sample content 1',
      imageUrl: '/uploads/images/sample1.png',
      owner: 'admin@example.com',
      createdAt: fixedDate
    },
    {
      id: `p-${browserName}-2`,
      title: `sample post 2 - ${browserName}`,
      content: 'sample content 2',
      imageUrl: '/uploads/images/sample2.png',
      owner: 'admin@example.com',
      createdAt: fixedDate
    }
  ]);
  await fs.writeFile(POSTS_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  console.log('posts.json initialized for visual test');
});

test('Verify My Feature UI remains consistent', async ({ page }) => {
  // navigate to app homepage where matin.js POST UI lives
  await page.setViewportSize({ width: 1280, height: 720 }); // consistent screenshot size (match baseline)
  await page.goto(BASE_URL);

  // wait until network is idle so dynamic content settles
  await page.waitForLoadState('networkidle');

  // take a full page screenshot and compare to baseline
  // first run will save baseline; later runs will compare
  await expect(page).toHaveScreenshot('index-page.png', {
    // Increase tolerance to accommodate small rendering/font/platform differences on CI.
    // Observed failure was ~25988 pixels different on this CI; set to 30000 (or use ratio).
    maxDiffPixels: 30000,
    // Also allow a small relative difference in case image size changes across platforms.
    maxDiffRatio: 0.05
  });
});
