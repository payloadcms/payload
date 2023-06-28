import { expect, Page, test } from '@playwright/test';
import { login } from '../helpers';
import { initPayloadE2E } from '../helpers/configHelpers';
import wait from '../../src/utilities/wait';

const { beforeAll, describe } = test;

describe('child field errors', () => {
  let serverURL: string;
  let page: Page;

  beforeAll(async ({ browser }) => {
    ({ serverURL } = await initPayloadE2E(__dirname));
    const context = await browser.newContext();
    page = await context.newPage();
    await login({ page, serverURL });
  });

  test('Remove row should remove error states from parent fields', async () => {
    await page.goto(`${serverURL}/admin/collections/posts/create`);

    await page.locator('#field-parentArray > .array-field__add-button-wrap > button').click();

    await page.locator('#parentArray\\.0-row-0 .collapsible__content .array-field__add-button-wrap > button').click();
    await page.locator('#field-parentArray__0__childArray__0__childArrayText').focus();
    await page.keyboard.type('T1');

    await page.locator('#parentArray\\.0-row-0 .collapsible__content .array-field__add-button-wrap > button').click();
    await page.locator('#field-parentArray__0__childArray__1__childArrayText').focus();
    await page.keyboard.type('T2');

    await wait(1000);

    await page.locator('#parentArray\\.0-row-0 .collapsible__content .array-field__add-button-wrap > button').click();
    await page.locator('#parentArray\\.0\\.childArray\\.2-row-2 .array-actions__button').click();
    await page.locator('#parentArray\\.0\\.childArray\\.2-row-2 .array-actions__action.array-actions__remove').click();

    await expect(await page.locator('#parentArray\\.0-row-0 .array-field__row-error-pill').innerText()).toBe('0');
    await wait(1000);
    console.log('the end');
  });
});
