import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import payload from '../../../src';
import { AdminUrlUtil } from '../../helpers/adminUrlUtil';
import { initPayloadE2E } from '../../helpers/configHelpers';
import { firstRegister } from '../helpers';
import { slug } from './config';

/**
 * TODO: Access Control
 * - [x] restricted collections not shown
 *  - no sidebar link
 *  - no route
 *  - no card
 * [x] field without read access should not show
 * prevent user from logging in (canAccessAdmin)
 * no create controls if no access
 * no update control if no update
 *  - check fields are rendered as readonly
 * no delete control if no access
 * no version controls is no access
 *
 * FSK: 'should properly prevent / allow public users from reading a restricted field'
 *
 * Repeat all above for globals
 */

const { beforeAll, describe } = test;
let url: AdminUrlUtil;

describe('access control', () => {
  let page: Page;

  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadE2E(__dirname);
    // await clearDocs(); // Clear any seeded data from onInit

    url = new AdminUrlUtil(serverURL, slug);

    const context = await browser.newContext();
    page = await context.newPage();

    await firstRegister({ page, serverURL });
  });

  // afterEach(async () => {
  // });

  test('field without read access should not show', async () => {
    const { id } = await createDoc({ restrictedField: 'restricted' });

    await page.goto(url.edit(id));

    await expect(page.locator('input[name="restrictedField"]')).toHaveCount(0);
  });

  describe('restricted collection', () => {
    test('should not show in card list', async () => {
      await page.goto(url.admin);
      await expect(page.locator('.dashboard__card-list >> text=Restricteds')).toHaveCount(0);
    });

    test('should not show in nav', async () => {
      await page.goto(url.admin);
      await expect(page.locator('.nav >> a:has-text("Restricteds")')).toHaveCount(0);
    });

    test('should not have collection url', async () => {
      await page.goto(url.list);
      await page.locator('text=Nothing found').click();
      await page.locator('a:has-text("Back to Dashboard")').click();
      await expect(page).toHaveURL(url.admin);
    });
  });
});

async function createDoc(data: any): Promise<{ id: string }> {
  return payload.create({
    collection: slug,
    data,
  });
}
