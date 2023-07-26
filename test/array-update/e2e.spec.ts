import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';
import { AdminUrlUtil } from '../helpers/adminUrlUtil';
import { initPayloadE2E } from '../helpers/configHelpers';
import { saveDocAndAssert } from '../helpers';
import { slug } from './config';

const { beforeAll, describe } = test;
let url: AdminUrlUtil;

describe('arrays', () => {
  let page: Page;

  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadE2E(__dirname);
    url = new AdminUrlUtil(serverURL, slug);

    const context = await browser.newContext();
    page = await context.newPage();
  });

  describe('row manipulation', () => {
    test('should add 2 new rows', async () => {
      await page.goto(url.create);

      await page.locator('#field-arrayOfFields > .array-field__add-button-wrap > button').click();
      await page.locator('#field-arrayOfFields > .array-field__add-button-wrap > button').click();
      await page.locator('#field-arrayOfFields__0__required').fill('array row 1');
      await page.locator('#field-arrayOfFields__1__required').fill('array row 2');

      await saveDocAndAssert(page);
    });

    test('should remove 2 new rows', async () => {
      await page.goto(url.create);

      await page.locator('#field-arrayOfFields > .array-field__add-button-wrap > button').click();
      await page.locator('#field-arrayOfFields > .array-field__add-button-wrap > button').click();
      await page.locator('#field-arrayOfFields__0__required').fill('array row 1');
      await page.locator('#field-arrayOfFields__1__required').fill('array row 2');

      await page.locator('#arrayOfFields-row-1 .array-actions__button').click();
      await page.locator('#arrayOfFields-row-1 .popup__scroll .array-actions__remove').click();
      await page.locator('#arrayOfFields-row-0 .array-actions__button').click();
      await page.locator('#arrayOfFields-row-0 .popup__scroll .array-actions__remove').click();

      const rowsContainer = await page.locator('#field-arrayOfFields > .array-field__draggable-rows');
      const directChildDivCount = await rowsContainer.evaluate((element) => {
        const childDivCount = element.querySelectorAll(':scope > div');
        return childDivCount.length;
      });

      expect(directChildDivCount).toBe(0);
    });

    test('should remove existing row', async () => {
      await page.goto(url.create);

      await page.locator('#field-arrayOfFields > .array-field__add-button-wrap > button').click();
      await page.locator('#field-arrayOfFields__0__required').fill('array row 1');

      await saveDocAndAssert(page);

      await page.locator('#arrayOfFields-row-0 .array-actions__button').click();
      await page.locator('#arrayOfFields-row-0 .popup__scroll .array-actions__action.array-actions__remove').click();

      const rowsContainer = await page.locator('#field-arrayOfFields > .array-field__draggable-rows');
      const directChildDivCount = await rowsContainer.evaluate((element) => {
        const childDivCount = element.querySelectorAll(':scope > div');
        return childDivCount.length;
      });

      expect(directChildDivCount).toBe(0);
    });

    test('should add row after removing existing row', async () => {
      await page.goto(url.create);

      await page.locator('#field-arrayOfFields > .array-field__add-button-wrap > button').click();
      await page.locator('#field-arrayOfFields > .array-field__add-button-wrap > button').click();
      await page.locator('#field-arrayOfFields__0__required').fill('array row 1');
      await page.locator('#field-arrayOfFields__1__required').fill('array row 2');

      await saveDocAndAssert(page);

      await page.locator('#arrayOfFields-row-1 .array-actions__button').click();
      await page.locator('#arrayOfFields-row-1 .popup__scroll .array-actions__action.array-actions__remove').click();
      await page.locator('#field-arrayOfFields > .array-field__add-button-wrap > button').click();

      await page.locator('#field-arrayOfFields__1__required').fill('updated array row 2');

      await saveDocAndAssert(page);

      const rowsContainer = await page.locator('#field-arrayOfFields > .array-field__draggable-rows');
      const directChildDivCount = await rowsContainer.evaluate((element) => {
        const childDivCount = element.querySelectorAll(':scope > div');
        return childDivCount.length;
      });

      expect(directChildDivCount).toBe(2);
    });
  });
});
