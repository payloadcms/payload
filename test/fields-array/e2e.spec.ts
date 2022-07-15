import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import wait from '../../src/utilities/wait';
import { AdminUrlUtil } from '../helpers/adminUrlUtil';
import { initPayloadTest } from '../helpers/configHelpers';
import { firstRegister } from '../helpers';
import { slug } from './config';

const { beforeAll, describe } = test;

let url: AdminUrlUtil;

describe('fields - array', () => {
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

    await firstRegister({ page, serverURL });
  });

  test('should be readOnly', async () => {
    await page.goto(url.create);
    await wait(2000);
    const field = page.locator('#readOnlyArray\\.0\\.text');
    await expect(field).toBeDisabled();
  });

  test('should have defaultValue', async () => {
    await page.goto(url.create);
    await wait(2000);
    const field = page.locator('#readOnlyArray\\.0\\.text');
    await expect(field).toHaveValue('defaultValue');
  });
});
