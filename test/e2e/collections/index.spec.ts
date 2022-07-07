// example.spec.ts
import { test, expect, Page } from '@playwright/test';
import { initPayloadTest } from '../../helpers/configHelpers';
import { firstRegister } from '../helpers';

let serverURL: string;

test.describe('collections', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Go to the starting url before each test.
    ({ serverURL } = await initPayloadTest({
      __dirname,
      init: {
        local: false,
      },
    }));

    const context = await browser.newContext();
    page = await context.newPage();

    await firstRegister({ page, serverURL });
  });

  test('should nav to create', async () => {
    await page.goto(`${serverURL}/admin`);
    const collectionLink = await page.locator('nav >> text=Posts');
    await collectionLink.click();
    await expect(page).toHaveURL(`${serverURL}/admin/collections/posts`);
  });
});
