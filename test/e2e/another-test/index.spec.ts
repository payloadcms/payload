import { expect, Page, test } from '@playwright/test';
import { AdminUrlUtil } from '../../helpers/adminUrlUtil';
import { initPayloadTest } from '../../helpers/configHelpers';
import { slug } from '../collections/config';
import { login } from '../helpers';

const { beforeAll, describe } = test;
let url: AdminUrlUtil;

describe('it should load the admin ui', () => {
  let page: Page;
  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadTest({
      __dirname,
      init: {
        local: false,
      },
    });
    url = new AdminUrlUtil(serverURL, slug);

    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page, serverURL });
  });

  test('should be redirected to dashboard', async () => {
    await expect(page).toHaveURL(url.admin);
    await expect(page.locator('.dashboard__wrap')).toBeVisible();
  });
});
