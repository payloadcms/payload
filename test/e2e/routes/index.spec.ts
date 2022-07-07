// example.spec.ts
import { test, expect } from '@playwright/test';
import { initPayloadTest } from '../../helpers/configHelpers';

let serverURL: string;

test.describe('it should load the admin ui', () => {
  test.beforeAll(async () => {
    // Go to the starting url before each test.
    ({ serverURL } = await initPayloadTest({
      __dirname,
      init: {
        local: false,
      },
    }));
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`${serverURL}/admin`);
  });

  test('my test', async ({ page }) => {
    await expect(page).toHaveURL(`${serverURL}/admin/create-first-user`);
  });
});
