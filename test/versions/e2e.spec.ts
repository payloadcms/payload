/**
 * TODO: Versions, 3 separate collections
 * - drafts
 *  - save draft before publishing
 *  - publish immediately
 *  - validation should be skipped when creating a draft
 *
 * - autosave
 * - versions (no drafts)
 *  - version control shown
 *  - assert version counts increment
 *  - navigate to versions
 *  - versions view accurately shows number of versions
 *  - compare
 *    - iterable
 *    - nested
 *    - relationship
 *    - select w/ i18n options (label: { en: 'example', ... })
 *    - tabs
 *    - text
 *    - richtext
 *  - restore version
 *  - specify locales to show
 */


import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { initPayloadE2E } from '../helpers/configHelpers';
import { AdminUrlUtil } from '../helpers/adminUrlUtil';
import { login } from '../helpers';
import { draftSlug } from './shared';

const { beforeAll, describe } = test;

describe('versions', () => {
  let page: Page;
  let serverURL: string;

  beforeAll(async ({ browser }) => {
    const config = await initPayloadE2E(__dirname);
    serverURL = config.serverURL;

    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page, serverURL });
  });

  describe('draft collections', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, draftSlug);
    });

    test('should bulk publish', async () => {
      await page.goto(url.list);

      await page.locator('.select-all__input').click();

      await page.locator('.publish-many__toggle').click();

      await page.locator('#confirm-publish').click();

      await expect(page.locator('.row-1 .cell-_status')).toContainText('Published');
      await expect(page.locator('.row-2 .cell-_status')).toContainText('Published');
    });

    test('should bulk unpublish', async () => {
      await page.goto(url.list);

      await page.locator('.select-all__input').click();

      await page.locator('.unpublish-many__toggle').click();

      await page.locator('#confirm-unpublish').click();

      await expect(page.locator('.row-1 .cell-_status')).toContainText('Draft');
      await expect(page.locator('.row-2 .cell-_status')).toContainText('Draft');
    });
  });
});
