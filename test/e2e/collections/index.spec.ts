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

  test('should nav to list', async () => {
    await page.goto(`${serverURL}/admin`);
    const collectionLink = page.locator('css=nav >> text=Posts');
    await collectionLink.click();
    await expect(page.url()).toContain(`${serverURL}/admin/collections/posts`);
  });

  test('should create', async () => {
    const title = 'post title';
    const description = 'description';
    await page.goto(`${serverURL}/admin/collections/posts/create`);
    const titleField = page.locator('#title');
    const descriptionField = page.locator('#description');
    await titleField.fill(title);
    await descriptionField.fill(description);
    await page.click('text=Save');
    await expect(page.locator('text=Post successfully created')).toBeVisible();
    await expect(page.url()).not.toContain('create');
    await expect(titleField).toHaveValue(title);
    await expect(descriptionField).toHaveValue(description);
  });
});
