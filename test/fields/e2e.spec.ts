import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { AdminUrlUtil } from '../helpers/adminUrlUtil';
import { initPayloadE2E } from '../helpers/configHelpers';
import { login, saveDocAndAssert } from '../helpers';
import { textDoc } from './collections/Text';

const { beforeAll, describe } = test;

let page: Page;
let url: AdminUrlUtil;

describe('fields', () => {
  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadE2E(__dirname);
    url = new AdminUrlUtil(serverURL, 'text-fields');

    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page, serverURL });
  });

  describe('text', () => {
    test('should display field in list view', async () => {
      await page.goto(url.list);
      const textCell = page.locator('table tr:first-child td:first-child a');
      await expect(textCell).toHaveText(textDoc.text);
    });
  });

  describe('point', () => {
    test('should save point', async () => {
      await page.goto(url.create, 'point-fields');
      const longField = page.locator('#field-longitude-point');
      await longField.fill('9');

      const latField = page.locator('#field-latitude-point');
      await latField.fill('-2');

      const localizedLongField = page.locator('#field-longitude-localized');
      await localizedLongField.fill('1');

      const localizedLatField = page.locator('#field-latitude-localized');
      await localizedLatField.fill('-1');

      const groupLongitude = page.locator('#field-longitude-group.point');
      await groupLongitude.fill('3');

      const groupLatField = page.locator('#field-latitude-group.point');
      await groupLatField.fill('-8');

      await saveDocAndAssert(page);
    });
  });
});
