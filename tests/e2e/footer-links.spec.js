import { test, expect } from '@playwright/test';
/**
 * End-to-End Tests for UI Footer Links
 *
 * These tests verify that footer links have been removed as per requirements:
 * - BB Chat link removed from index.html and view.html
 * - View Paste link removed from index.html footer
 * - New Paste link removed from view.html footer
 */
test.describe('Footer Links Removal', () => {
    test('should not have BB Chat link in index.html footer', async ({ page }) => {
        await page.goto('/');
        // Verify footer exists
        const footer = page.locator('.footer');
        await expect(footer).toBeVisible();
        // Verify BB Chat link is not present
        const bbChatLink = footer.locator('a[href="chat.html"]');
        await expect(bbChatLink).not.toBeVisible();
        // Verify View Paste link is not present in footer
        const viewPasteLink = footer.locator('a[href="view.html"]');
        await expect(viewPasteLink).not.toBeVisible();
    });
    test('should not have BB Chat or New Paste links in view.html footer', async ({ page }) => {
        await page.goto('/view.html?p=test-id#test-key:test-iv');
        // Wait for page to load
        await page.waitForSelector('.footer');
        const footer = page.locator('.footer');
        await expect(footer).toBeVisible();
        // Verify BB Chat link is not present
        const bbChatLink = footer.locator('a[href="chat.html"]');
        await expect(bbChatLink).not.toBeVisible();
        // Verify New Paste link is not present in footer
        const newPasteLink = footer.locator('a[href="index.html"]');
        await expect(newPasteLink).not.toBeVisible();
    });
    test('should have View Paste button in success output instead of footer link', async ({ page }) => {
        // Mock API endpoints
        await page.route('**/api/pow', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    challenge: 'test-challenge',
                    difficulty: 1
                })
            });
        });
        await page.route('**/api/pastes', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'test-paste-id',
                    deleteToken: 'test-delete-token'
                })
            });
        });
        await page.goto('/');
        await page.fill('#paste', 'Test content');
        await page.click('#save');
        // Wait for success output
        await page.waitForSelector('#output');
        // Verify View Paste button exists in output (not footer)
        const viewBtn = page.locator('#viewBtn');
        await expect(viewBtn).toBeVisible();
        await expect(viewBtn).toContainText('View Paste');
        // Verify footer does not have View Paste link
        const footer = page.locator('.footer');
        const footerViewLink = footer.locator('a[href*="view.html"]');
        await expect(footerViewLink).not.toBeVisible();
    });
});
//# sourceMappingURL=footer-links.spec.js.map