import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { AdminUrlUtil } from '../../helpers/adminUrlUtil';
import { initPayloadTest } from '../../helpers/configHelpers';
import { firstRegister } from '../helpers';
import { slug } from './config';


/**
 * TODO: Access Control
 * restricted collections not shown
 *  - no sidebar link
 *  - no route
 * field without read access should not show
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
