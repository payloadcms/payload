// example.spec.ts
import { test, expect, Page } from '@playwright/test';
import wait from '../../../src/utilities/wait';
import { initPayloadTest } from '../../helpers/configHelpers';
import { firstRegister } from '../helpers';
import { slug } from './config';

const { beforeAll, describe } = test;

let serverURL: string;

describe('it should create array', () => {
  let page: Page;
  beforeAll(async ({ browser }) => {
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

  test('should be readOnly', async () => {
    await page.goto(`${serverURL}/admin/collections/${slug}/create`);
    await wait(2000);
    const field = page.locator('#readOnlyArray\\.0\\.text');
    await expect(field).toBeDisabled();
  });

  test('should have defaultValue', async () => {
    await page.goto(`${serverURL}/admin/collections/${slug}/create`);
    await wait(2000);
    const field = page.locator('#readOnlyArray\\.0\\.text');
    await expect(field).toHaveValue('defaultValue');
  });
});
