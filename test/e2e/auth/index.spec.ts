import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { AdminUrlUtil } from '../../helpers/adminUrlUtil';
import { initPayloadTest } from '../../helpers/configHelpers';
import { firstRegister } from '../helpers';
import { slug } from './config';


/**
 * TODO: Auth
 * change password
 * unlock
 * generate api key
 * log out
 */

const { beforeAll, describe } = test;
let url: AdminUrlUtil;

describe('authentication', () => {
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

  describe('Authentication', () => {
    test('should login and logout', () => {
      expect(1).toEqual(1);
    });
    test('should logout', () => {
      expect(1).toEqual(1);
    });
    test('should allow change password', () => {
      expect(1).toEqual(1);
    });
    test('should reset password', () => {
      expect(1).toEqual(1);
    });
    test('should lockout after reaching max login attempts', () => {
      expect(1).toEqual(1);
    });
    test('should prevent login for locked user', () => {
      expect(1).toEqual(1);
    });
    test('should unlock user', () => {
      expect(1).toEqual(1);
    });
    test('should not login without verify', () => {
      expect(1).toEqual(1);
    });
    test('should allow generate api keys', () => {
      expect(1).toEqual(1);
    });
  });
});
