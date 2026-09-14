const { test, expect } = require('@playwright/test');

test.describe('Frontend', () => {
  test('loads and shows the deployment status as ok', async ({ page }) => {
    await page.goto('/ui/');

    await expect(page).toHaveTitle('CI/CD Kube');
    await expect(page.locator('h1')).toHaveText('CI/CD Kube');

    const status = page.getByTestId('status');
    await expect(status).toHaveText('ok');
  });
});
