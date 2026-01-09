import { test, expect, Page } from '@playwright/test';
import { Buffer } from 'buffer';

const BASE_URL = 'http://localhost:5050';

// helper to open modal quickly
async function openModal(page: Page) {
  await page.goto(BASE_URL);
  await page.click('#openAddBtn');
  await page.waitForSelector('#title', { state: 'visible' });
}

test.describe('matin.js create-post branches', () => {

  test('shows validation alert when title missing', async ({ page }) => {
    await openModal(page);
    // capture alert text
    let msg = '';
    page.on('dialog', d => { msg = d.message(); d.accept(); });
    await page.fill('#content', 'content only'); // no title
    await page.click('#modalAdd');
    expect(msg.toLowerCase()).toContain('title and content'); // validation alert branch
  });

  test('shows invalid email alert', async ({ page }) => {
    await openModal(page);
    let msg = '';
    page.on('dialog', d => { msg = d.message(); d.accept(); });
    await page.fill('#title', 't');
    await page.fill('#content', 'c');
    await page.fill('#owner', 'not-an-email'); // invalid email
    await page.click('#modalAdd');
    expect(msg.toLowerCase()).toContain('please enter a valid email'); // email validation branch
  });

  test('image preview shows when file selected', async ({ page }) => {
    await openModal(page);
    // create small file in memory and set it
    await page.setInputFiles('#imageInput', { name: 'pic.png', mimeType: 'image/png', buffer: Buffer.from([137,80,78,71]) });
    // preview element should be visible and have non-empty src
    const src = await page.locator('#imagePreview').getAttribute('src');
    const display = await page.locator('#imagePreview').evaluate((e: any) => (e as any).style.display);
    expect(display).not.toBe('none');
    expect(src).toBeTruthy(); // preview path/url should be set
  });

  test('upload failure shows alert and does not crash', async ({ page }) => {
    await openModal(page);
    // intercept upload to force failure
    await page.route('**/upload', route => route.fulfill({ status: 500, body: JSON.stringify({ message: 'fail' }) }));
    let msg = '';
    page.on('dialog', d => { msg = d.message(); d.accept(); });
    await page.fill('#title', 't');
    await page.fill('#content', 'c');
    await page.setInputFiles('#imageInput', { name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from([137,80,78,71]) });
    await page.click('#modalAdd');
    // script alerts 'Image upload failed:' path
    expect(msg.toLowerCase()).toContain('image upload failed');
  });

  test('successful add calls loadPosts when available', async ({ page }) => {
    await page.goto(BASE_URL);
    // stub loadPosts on window to detect call
    await page.evaluate(() => { (window as any).__loadCalled = false; (window as any).loadPosts = function() { (window as any).__loadCalled = true; }; });
    await page.click('#openAddBtn');
    await page.fill('#title', 'ui-title');
    await page.fill('#content', 'ui-content');
    await page.fill('#owner', 'i@me.com');
    // submit and wait for add-post response
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/add-post') && r.status() === 201),
      page.click('#modalAdd')
    ]);
    // check the spy flag
    const called = await page.evaluate(() => (window as any).__loadCalled === true);
    expect(called).toBeTruthy();
  });

  test('resetModalForm clears inputs and preview', async ({ page }) => {
    await openModal(page);
    await page.fill('#title', 'x');
    await page.fill('#content', 'y');
    await page.fill('#owner', 'z@z.com');
    await page.setInputFiles('#imageInput', { name: 'pic.png', mimeType: 'image/png', buffer: Buffer.from([137,80,78,71]) });
    // call resetModalForm directly on page
    await page.evaluate(() => { const w = window as any; if (typeof w.resetModalForm === 'function') w.resetModalForm(); });
    const t = await page.inputValue('#title');
    const c = await page.inputValue('#content');
    const o = await page.inputValue('#owner');
    const previewDisplay = await page.locator('#imagePreview').evaluate((e: any) => (e as any).style.display);
    expect(t).toBe('');
    expect(c).toBe('');
    expect(o).toBe('');
    expect(previewDisplay).toBe('none');
  });

});