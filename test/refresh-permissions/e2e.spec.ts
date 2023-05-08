import { expect, Page, test } from '@playwright/test';
import { login } from '../helpers';
import { initPayloadE2E } from '../helpers/configHelpers';

const { beforeAll, describe } = test;

describe('refresh-permissions', () => {
  let serverURL: string;
  let page: Page;

  beforeAll(async ({ browser }) => {
    ({ serverURL } = await initPayloadE2E(__dirname));
    const context = await browser.newContext();
    page = await context.newPage();
    await login({ page, serverURL });
  });

  test('should show test global immediately after allowing access', async () => {
    await page.goto(`${serverURL}/admin/globals/settings`);

    // Ensure that we have loaded accesses by checking that settings collection
    // at least is visible in the menu.
    await expect(page.locator('#nav-global-settings')).toBeVisible();

    // Test collection should be hidden at first.
    await expect(page.locator('#nav-global-test')).toBeHidden();

    // Allow access to test global.
    await page.locator('.custom-checkbox:has(#field-test) button').click();
    await page.locator('#action-save').click();

    // Now test collection should appear in the menu.
    await expect(page.locator('#nav-global-test')).toBeVisible();
  });
});
