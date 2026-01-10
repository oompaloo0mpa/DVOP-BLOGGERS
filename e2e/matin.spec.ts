import { test, expect, Page } from '@playwright/test';
import { Buffer } from 'buffer';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://localhost:5050';
const coverageDir = path.join(process.cwd(), 'coverage/temp');

// Valid 1x1 PNG for image tests
const VALID_PNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
  0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54,
  0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F, 0x00,
  0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59, 0xE7,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
  0xAE, 0x42, 0x60, 0x82
]);

// helper to open modal quickly
async function openModal(page: Page) {
  await page.goto(BASE_URL);
  await page.click('#openAddBtn');
  await page.waitForSelector('#title', { state: 'visible' });
}

test.describe('matin.js create-post branches', () => {

  // Coverage collection hooks
  test.beforeEach(async ({ page, browserName }) => {
    if (browserName === 'chromium') {
      await page.coverage.startJSCoverage();
    }
  });

  test.afterEach(async ({ page, browserName }, testInfo) => {
    if (browserName === 'chromium') {
      const coverage = await page.coverage.stopJSCoverage();
      try {
        await fs.access(coverageDir);
      } catch {
        await fs.mkdir(coverageDir, { recursive: true });
      }
      const filePath = path.join(
        coverageDir,
        `v8-coverage-matin-${testInfo.title.replace(/[\W_]+/g, '-')}.json`
      );
      await fs.writeFile(filePath, JSON.stringify(coverage));
    }
  });

  // ============ VALIDATION BRANCHES ============

  // Branch: if (!title || !content) - missing title
  test('shows validation alert when title missing', async ({ page }) => {
    await openModal(page);
    let msg = '';
    page.on('dialog', async d => { msg = d.message(); await d.accept(); });
    await page.fill('#content', 'content only');
    await page.click('#modalAdd');
    await page.waitForTimeout(500);
    expect(msg.toLowerCase()).toContain('title and content');
  });

  // Branch: if (!title || !content) - missing content  
  test('shows validation alert when content missing', async ({ page }) => {
    await openModal(page);
    let msg = '';
    page.on('dialog', async d => { msg = d.message(); await d.accept(); });
    await page.fill('#title', 'title only');
    await page.click('#modalAdd');
    await page.waitForTimeout(500);
    expect(msg.toLowerCase()).toContain('title and content');
  });

  // Branch: if (owner && !emailPattern.test(owner))
  test('shows invalid email alert', async ({ page }) => {
    await openModal(page);
    let msg = '';
    page.on('dialog', async d => { msg = d.message(); await d.accept(); });
    await page.fill('#title', 't');
    await page.fill('#content', 'c');
    await page.fill('#owner', 'not-an-email');
    await page.click('#modalAdd');
    await page.waitForTimeout(500);
    expect(msg.toLowerCase()).toContain('please enter a valid email');
  });

  // ============ IMAGE UPLOAD BRANCHES ============

  // Branch: if (!upRes.ok) - upload fails
  test('upload failure shows alert', async ({ page }) => {
    await openModal(page);
    await page.route('**/upload', route => route.fulfill({ 
      status: 500, 
      contentType: 'application/json',
      body: JSON.stringify({ message: 'fail' }) 
    }));
    const dialogPromise = page.waitForEvent('dialog');
    await page.fill('#title', 't');
    await page.fill('#content', 'c');
    await page.setInputFiles('#imageInput', { name: 'bad.png', mimeType: 'image/png', buffer: VALID_PNG });
    await page.click('#modalAdd');
    const dialog = await dialogPromise;
    expect(dialog.message().toLowerCase()).toContain('image upload failed');
    await dialog.accept();
  });

  // ============ POST SUCCESS BRANCHES ============

  // Branch: if (request.status === 201) + if (n) notif exists - with image upload
  test('successful add with image shows notif and calls loadPosts', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => { 
      (window as any).__loadCalled = false; 
      (window as any).loadPosts = function() { (window as any).__loadCalled = true; }; 
    });
    await page.click('#openAddBtn');
    await page.waitForSelector('#title', { state: 'visible' });
    await page.fill('#title', 'ui-title');
    await page.fill('#content', 'ui-content');
    await page.fill('#owner', 'i@me.com');
    await page.setInputFiles('#imageInput', { name: 'img.png', mimeType: 'image/png', buffer: VALID_PNG });
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/add-post') && r.status() === 201),
      page.click('#modalAdd')
    ]);
    const called = await page.evaluate(() => (window as any).__loadCalled === true);
    expect(called).toBeTruthy();
  });

  // Branch: if (n) else - notif element missing, shows alert
  test('shows "Added Post" alert when notif element missing', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      const notif = document.getElementById('notif');
      if (notif) notif.remove();
    });
    await page.click('#openAddBtn');
    await page.waitForSelector('#title', { state: 'visible' });
    const dialogPromise = page.waitForEvent('dialog');
    await page.fill('#title', 'alert-title');
    await page.fill('#content', 'alert-content');
    await page.click('#modalAdd');
    const dialog = await dialogPromise;
    expect(dialog.message().toLowerCase()).toContain('added post');
    await dialog.accept();
  });

  // Branch: request.status !== 201 - server error
  test('shows "Unable to add post!" alert when server returns non-201', async ({ page }) => {
    await openModal(page);
    await page.route('**/add-post', route => route.fulfill({ 
      status: 400, 
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Server error' }) 
    }));
    let msg = '';
    page.on('dialog', async d => { msg = d.message(); await d.accept(); });
    await page.fill('#title', 'test-title');
    await page.fill('#content', 'test-content');
    await page.click('#modalAdd');
    await page.waitForTimeout(1000);
    expect(msg.toLowerCase()).toContain('unable to add post');
  });

  // Branch: catch (err) - network error in try block
  test('shows error alert when network/fetch fails', async ({ page }) => {
    await openModal(page);
    await page.route('**/upload', route => route.abort('failed'));
    let msg = '';
    page.on('dialog', async d => { msg = d.message(); await d.accept(); });
    await page.fill('#title', 'err-title');
    await page.fill('#content', 'err-content');
    await page.setInputFiles('#imageInput', { name: 'net-fail.png', mimeType: 'image/png', buffer: VALID_PNG });
    await page.click('#modalAdd');
    await page.waitForTimeout(1000);
    expect(msg.toLowerCase()).toContain('error');
  });

  // Branch: JSON.parse catch - invalid JSON response
  test('handles invalid JSON response gracefully', async ({ page }) => {
    await openModal(page);
    await page.route('**/add-post', route => route.fulfill({ 
      status: 201, 
      contentType: 'text/plain',
      body: 'not valid json {{{' 
    }));
    await page.fill('#title', 'json-test');
    await page.fill('#content', 'json-content');
    // Should not crash, notif should still show
    await page.click('#modalAdd');
    await page.waitForTimeout(500);
    const notif = await page.locator('#notif').textContent();
    expect(notif).toContain('Post added');
  });

  // Branch: imageUrl || "" and owner || "" - empty values
  test('successful add without image and without owner', async ({ page }) => {
    await openModal(page);
    await page.fill('#title', 'no-image-title');
    await page.fill('#content', 'no-image-content');
    // No owner, no image - tests the || "" branches
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/add-post') && r.status() === 201),
      page.click('#modalAdd')
    ]);
    const notif = await page.locator('#notif').textContent();
    expect(notif).toContain('Post added');
  });

  // Branch: hideModal function exists and is called
  test('hideModal is called when available', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => { 
      (window as any).__hideCalled = false; 
      (window as any).hideModal = function() { (window as any).__hideCalled = true; }; 
    });
    await page.click('#openAddBtn');
    await page.waitForSelector('#title', { state: 'visible' });
    await page.fill('#title', 'hide-title');
    await page.fill('#content', 'hide-content');
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/add-post') && r.status() === 201),
      page.click('#modalAdd')
    ]);
    const called = await page.evaluate(() => (window as any).__hideCalled === true);
    expect(called).toBeTruthy();
  });

  // ============ previewImage BRANCHES ============

  // Branch: if (!input || !img) return - elements don't exist
  test('previewImage returns early if elements missing', async ({ page }) => {
    await page.goto(BASE_URL);
    // Call previewImage with non-existent IDs
    const result = await page.evaluate(() => {
      const w = window as any;
      if (typeof w.previewImage === 'function') {
        w.previewImage('nonexistent', 'alsoNonexistent');
        return 'called';
      }
      return 'not found';
    });
    expect(result).toBe('called');
  });

  // Branch: if (!f) - file cleared, triggers cleanup
  test('image preview clears when file removed', async ({ page }) => {
    await openModal(page);
    await page.setInputFiles('#imageInput', { name: 'pic.png', mimeType: 'image/png', buffer: VALID_PNG });
    let display = await page.locator('#imagePreview').evaluate((e: any) => e.style.display);
    expect(display).toBe('block');
    
    // Clear the file input
    await page.evaluate(() => {
      const input = document.getElementById('imageInput') as HTMLInputElement;
      const dt = new DataTransfer();
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    display = await page.locator('#imagePreview').evaluate((e: any) => e.style.display);
    expect(display).toBe('none');
  });

  // Branch: if (objectUrl) in change handler - revoke previous URL
  test('image preview revokes previous objectUrl on new file', async ({ page }) => {
    await openModal(page);
    await page.evaluate(() => {
      (window as any).__revokeCount = 0;
      const orig = URL.revokeObjectURL;
      URL.revokeObjectURL = function(url) {
        (window as any).__revokeCount++;
        return orig.call(URL, url);
      };
    });
    // Set first image
    await page.setInputFiles('#imageInput', { name: 'first.png', mimeType: 'image/png', buffer: VALID_PNG });
    await page.waitForTimeout(100);
    // Set second image - should revoke the first objectUrl
    await page.setInputFiles('#imageInput', { name: 'second.png', mimeType: 'image/png', buffer: VALID_PNG });
    await page.waitForTimeout(100);
    const revokeCount = await page.evaluate(() => (window as any).__revokeCount);
    expect(revokeCount).toBeGreaterThanOrEqual(1);
  });

  // Branch: img.onload callback - revoke after load
  test('image onload triggers revokeObjectURL', async ({ page }) => {
    await openModal(page);
    await page.evaluate(() => {
      (window as any).__revokeCount = 0;
      const orig = URL.revokeObjectURL;
      URL.revokeObjectURL = function(url) {
        (window as any).__revokeCount++;
        return orig.call(URL, url);
      };
    });
    await page.setInputFiles('#imageInput', { name: 'valid.png', mimeType: 'image/png', buffer: VALID_PNG });
    // Wait for image to load completely
    await page.waitForFunction(() => {
      const img = document.getElementById('imagePreview') as HTMLImageElement;
      return img && img.complete && img.naturalWidth > 0;
    }, { timeout: 5000 });
    await page.waitForTimeout(300);
    const revokeCount = await page.evaluate(() => (window as any).__revokeCount);
    expect(revokeCount).toBeGreaterThanOrEqual(1);
  });

  // ============ resetModalForm BRANCHES ============

  // Branch: resetModalForm - all elements exist
  test('resetModalForm clears all inputs and preview', async ({ page }) => {
    await openModal(page);
    await page.fill('#title', 'x');
    await page.fill('#content', 'y');
    await page.fill('#owner', 'z@z.com');
    await page.setInputFiles('#imageInput', { name: 'pic.png', mimeType: 'image/png', buffer: VALID_PNG });
    
    await page.evaluate(() => { 
      const w = window as any; 
      if (typeof w.resetModalForm === 'function') w.resetModalForm(); 
    });
    
    const t = await page.inputValue('#title');
    const c = await page.inputValue('#content');
    const o = await page.inputValue('#owner');
    const previewDisplay = await page.locator('#imagePreview').evaluate((e: any) => e.style.display);
    expect(t).toBe('');
    expect(c).toBe('');
    expect(o).toBe('');
    expect(previewDisplay).toBe('none');
  });

  // Branch: resetModalForm catch - error handling
  test('resetModalForm handles errors gracefully', async ({ page }) => {
    await page.goto(BASE_URL);
    // Remove elements to cause errors inside resetModalForm
    await page.evaluate(() => {
      const title = document.getElementById('title');
      if (title) {
        Object.defineProperty(title, 'value', { 
          set: () => { throw new Error('test error'); }
        });
      }
    });
    // Should not throw, just log error
    const result = await page.evaluate(() => {
      try {
        const w = window as any;
        if (typeof w.resetModalForm === 'function') w.resetModalForm();
        return 'completed';
      } catch (e) {
        return 'threw';
      }
    });
    expect(result).toBe('completed');
  });

  // ============ CATCH BLOCK COVERAGE ============

  // Branch: loadPosts catch block
  test('loadPosts error is caught silently', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => { 
      (window as any).loadPosts = function() { throw new Error('loadPosts error'); }; 
    });
    await page.click('#openAddBtn');
    await page.waitForSelector('#title', { state: 'visible' });
    await page.fill('#title', 'catch-title');
    await page.fill('#content', 'catch-content');
    // Should not crash despite loadPosts throwing
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/add-post') && r.status() === 201),
      page.click('#modalAdd')
    ]);
    const notif = await page.locator('#notif').textContent();
    expect(notif).toContain('Post added');
  });

  // Branch: hideModal catch block  
  test('hideModal error is caught silently', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => { 
      (window as any).hideModal = function() { throw new Error('hideModal error'); }; 
    });
    await page.click('#openAddBtn');
    await page.waitForSelector('#title', { state: 'visible' });
    await page.fill('#title', 'hide-catch');
    await page.fill('#content', 'hide-content');
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/add-post') && r.status() === 201),
      page.click('#modalAdd')
    ]);
    const notif = await page.locator('#notif').textContent();
    expect(notif).toContain('Post added');
  });

  // Branch: outer try-catch in notification block
  test('notification error triggers alert fallback', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      const notif = document.getElementById('notif');
      if (notif) {
        Object.defineProperty(notif, 'textContent', {
          set: () => { throw new Error('notif error'); }
        });
      }
    });
    await page.click('#openAddBtn');
    await page.waitForSelector('#title', { state: 'visible' });
    let msg = '';
    page.on('dialog', async d => { msg = d.message(); await d.accept(); });
    await page.fill('#title', 'notif-error');
    await page.fill('#content', 'notif-content');
    await page.click('#modalAdd');
    await page.waitForTimeout(1000);
    expect(msg.toLowerCase()).toContain('added post');
  });

});