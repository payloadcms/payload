import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { AdminUrlUtil } from '../../helpers/adminUrlUtil';
import { initPayloadTest } from '../../helpers/configHelpers';
import { firstRegister } from '../helpers';
import { slug } from './config';


/**
 * TODO: Localization
 * - create doc in spanish locale
 * - retrieve doc in spanish locale
 * - retrieve doc in default locale, check for null fields
 * - add translations in english to spanish doc
 * - check locale toggle button
 *
 * Fieldtypes to test: (collections for each field type)
 *  - localized and non-localized: array, block, group, relationship, text
 *
 * Repeat above for Globals
 */

const { beforeAll, describe } = test;
let url: AdminUrlUtil;

describe('suite name', () => {
  let page: Page;

  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadTest({
      __dirname,
      init: {
        local: false,
      },
    });
    // await clearDocs(); // Clear any seeded data from onInit

    url = new AdminUrlUtil(serverURL, slug);

    const context = await browser.newContext();
    page = await context.newPage();

    await firstRegister({ page, serverURL });
  });

  // afterEach(async () => {
  // });

  describe('feature', () => {
    test('testname', () => {
      expect(1).toEqual(1);
    });
  });
});
