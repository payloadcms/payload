import { expect, Page, test } from '@playwright/test';
import { login } from '../helpers';
import { initPayloadE2E } from '../helpers/configHelpers';

const { beforeAll, describe } = test;

describe('field error states', () => {
  let serverURL: string;
  let page: Page;

  beforeAll(async ({ browser }) => {
    ({ serverURL } = await initPayloadE2E(__dirname));
    const context = await browser.newContext();
    page = await context.newPage();
    await login({ page, serverURL });
  });

  test('Remove row should remove error states from parent fields', async () => {
    await page.goto(`${serverURL}/admin/collections/error-fields/create`);

    // add parent array
    await page.locator('#field-parentArray > .array-field__add-button-wrap > button').click();

    // add first child array
    await page.locator('#parentArray-row-0 .collapsible__content .array-field__add-button-wrap > button').click();
    await page.locator('#field-parentArray__0__childArray__0__childArrayText').focus();
    await page.keyboard.type('T1');

    // add second child array
    await page.locator('#parentArray-row-0 .collapsible__content .array-field__add-button-wrap > button').click();
    await page.locator('#field-parentArray__0__childArray__1__childArrayText').focus();
    await page.keyboard.type('T2');

    // add third child array
    await page.locator('#parentArray-row-0 .collapsible__content .array-field__add-button-wrap > button').click();
    await page.locator('#parentArray-0-childArray-row-2 .array-actions__button').click();
    await page.locator('#parentArray-0-childArray-row-2 .array-actions__action.array-actions__remove').click();

    await page.locator('#action-save').click();

    const errorPill = await page.waitForSelector('#parentArray-row-0 > .collapsible > .collapsible__toggle-wrap .array-field__row-error-pill', { state: 'hidden', timeout: 500 });
    expect(errorPill).toBeNull();
  });
});
