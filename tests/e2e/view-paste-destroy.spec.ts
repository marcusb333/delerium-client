import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for Destroy Paste Functionality on View Page
 * 
 * These tests verify that the destroy paste button appears and works correctly
 * on the view.html page when a delete token exists in sessionStorage.
 * 
 * Test Coverage:
 * - Destroy button appears when delete token exists in sessionStorage
 * - Destroy button is hidden when no delete token exists
 * - Successful deletion flow
 * - Error handling during deletion
 * - Confirmation dialog
 * - sessionStorage cleanup after deletion
 */
test.describe('View Page - Destroy Paste Button', () => {
  test.beforeEach(async ({ page }) => {
    // Mock paste retrieval API
    await page.route('**/api/pastes/test-paste-id', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ct: 'test-ciphertext',
          iv: 'test-iv',
          meta: {
            expireTs: Math.floor(Date.now() / 1000) + 3600,
            viewsAllowed: 10
          },
          viewsLeft: 9
        })
      });
    });
  });

    test('should show destroy button when delete token exists in sessionStorage', async ({ page, context }) => {
      // Set delete token in sessionStorage before navigating
      await context.addInitScript(() => {
        sessionStorage.setItem('deleteToken_test-paste-id', 'test-delete-token-789');
      });

      await page.goto('/view.html?p=test-paste-id#test-key:test-iv');

      // Wait for page to load and decrypt
      await page.waitForSelector('#content');

      // Verify destroy button is visible
      const destroyBtn = page.locator('#destroyBtn');
      await expect(destroyBtn).toBeVisible();
      await expect(destroyBtn).toContainText('Destroy Paste');
    });

    test('should hide destroy button when no delete token exists', async ({ page }) => {
      // Clear sessionStorage to ensure no token exists
      await page.goto('/view.html?p=test-paste-id#test-key:test-iv');

      // Wait for page to load
      await page.waitForSelector('#content');

      // Verify destroy button is hidden
      const destroyBtn = page.locator('#destroyBtn');
      await expect(destroyBtn).not.toBeVisible();
    });

    test('should successfully delete paste when destroy button is clicked', async ({ page, context }) => {
      // Set delete token in sessionStorage
      await context.addInitScript(() => {
        sessionStorage.setItem('deleteToken_test-paste-id', 'test-delete-token-789');
      });

      // Mock successful deletion
      await page.route('**/api/pastes/test-paste-id?token=test-delete-token-789', async route => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 204,
            body: ''
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/view.html?p=test-paste-id#test-key:test-iv');
      await page.waitForSelector('#content');

      // Set up dialog handler for confirmation
      page.once('dialog', dialog => {
        expect(dialog.message()).toContain('Are you sure you want to permanently delete');
        dialog.accept();
      });

      // Click destroy button
      const destroyBtn = page.locator('#destroyBtn');
      await destroyBtn.click();

      // Wait for deletion to complete
      await page.waitForTimeout(500);

      // Verify success message
      const content = await page.textContent('#content');
      expect(content).toContain('Paste has been permanently deleted');

      // Verify destroy button is hidden after deletion
      await expect(destroyBtn).not.toBeVisible();

      // Verify token is removed from sessionStorage
      const tokenInStorage = await page.evaluate(() => sessionStorage.getItem('deleteToken_test-paste-id'));
      expect(tokenInStorage).toBeNull();
    });

    test('should show confirmation dialog before deleting', async ({ page, context }) => {
      // Set delete token in sessionStorage
      await context.addInitScript(() => {
        sessionStorage.setItem('deleteToken_test-paste-id', 'test-delete-token-789');
      });

      await page.goto('/view.html?p=test-paste-id#test-key:test-iv');
      await page.waitForSelector('#content');

      let dialogShown = false;
      page.once('dialog', dialog => {
        dialogShown = true;
        expect(dialog.message()).toContain('Are you sure you want to permanently delete');
        expect(dialog.message()).toContain('This action cannot be undone');
        dialog.dismiss(); // Cancel deletion
      });

      const destroyBtn = page.locator('#destroyBtn');
      await destroyBtn.click();

      // Verify dialog was shown
      expect(dialogShown).toBe(true);

      // Verify paste is still visible (not deleted)
      const content = await page.textContent('#content');
      expect(content).not.toContain('Paste has been permanently deleted');
    });

    test('should handle deletion errors gracefully', async ({ page, context }) => {
      // Set delete token in sessionStorage
      await context.addInitScript(() => {
        sessionStorage.setItem('deleteToken_test-paste-id', 'test-delete-token-789');
      });

      // Mock deletion error
      await page.route('**/api/pastes/test-paste-id?token=test-delete-token-789', async route => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid token' })
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/view.html?p=test-paste-id#test-key:test-iv');
      await page.waitForSelector('#content');

      // Set up dialog handlers
      page.once('dialog', dialog => dialog.accept()); // Confirm deletion

      const destroyBtn = page.locator('#destroyBtn');
      await destroyBtn.click();

      // Wait for error alert
      await page.waitForTimeout(500);

      // Verify error was shown (alert dialog)
      // Note: Playwright can't easily test alert() calls, but we can verify
      // the button is restored (not hidden)
      await expect(destroyBtn).toBeVisible();
    });

    test('should show loading state during deletion', async ({ page, context }) => {
      // Set delete token in sessionStorage
      await context.addInitScript(() => {
        sessionStorage.setItem('deleteToken_test-paste-id', 'test-delete-token-789');
      });

      // Mock delayed deletion response
      await page.route('**/api/pastes/test-paste-id?token=test-delete-token-789', async route => {
        if (route.request().method() === 'DELETE') {
          await new Promise(resolve => setTimeout(resolve, 500));
          await route.fulfill({
            status: 204,
            body: ''
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/view.html?p=test-paste-id#test-key:test-iv');
      await page.waitForSelector('#content');

      page.once('dialog', dialog => dialog.accept());

      const destroyBtn = page.locator('#destroyBtn');
      
      // Click and immediately check loading state
      const clickPromise = destroyBtn.click();
      
      // Verify loading state appears
      await expect(destroyBtn).toBeDisabled({ timeout: 1000 });
      await expect(destroyBtn).toContainText('Deleting...');
      
      await clickPromise;
    });
});
