import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import payload from '../../src';
import { AdminUrlUtil } from '../helpers/adminUrlUtil';
import { initPayloadE2E } from '../helpers/configHelpers';
import { login } from '../helpers';
import { restrictedVersionsSlug, readOnlySlug, restrictedSlug, slug, docLevelAccessSlug } from './config';
import type { ReadOnlyCollection, RestrictedVersion } from './payload-types';

/**
 * TODO: Access Control
 * prevent user from logging in (canAccessAdmin)
 *
 * FSK: 'should properly prevent / allow public users from reading a restricted field'
 *
 * Repeat all above for globals
 */

const { beforeAll, describe } = test;
describe('access control', () => {
  let page: Page;
  let url: AdminUrlUtil;
  let restrictedUrl: AdminUrlUtil;
  let readOnlyUrl: AdminUrlUtil;
  let restrictedVersionsUrl: AdminUrlUtil;
  let serverURL: string;

  beforeAll(async ({ browser }) => {
    const config = await initPayloadE2E(__dirname);
    serverURL = config.serverURL;

    url = new AdminUrlUtil(serverURL, slug);
    restrictedUrl = new AdminUrlUtil(serverURL, restrictedSlug);
    readOnlyUrl = new AdminUrlUtil(serverURL, readOnlySlug);
    restrictedVersionsUrl = new AdminUrlUtil(serverURL, restrictedVersionsSlug);

    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page, serverURL });
  });

  test('field without read access should not show', async () => {
    const { id } = await createDoc({ restrictedField: 'restricted' });

    await page.goto(url.edit(id));

    await expect(page.locator('#field-restrictedField')).toHaveCount(0);
  });

  test('field without read access inside a group should not show', async () => {
    const { id } = await createDoc({ restrictedField: 'restricted' });

    await page.goto(url.edit(id));

    await expect(page.locator('#field-group__restrictedGroupText')).toHaveCount(0);
  });

  test('field without read access inside a collapsible should not show', async () => {
    const { id } = await createDoc({ restrictedField: 'restricted' });

    await page.goto(url.edit(id));

    await expect(page.locator('#field-restrictedRowText')).toHaveCount(0);
  });

  test('field without read access inside a row should not show', async () => {
    const { id } = await createDoc({ restrictedField: 'restricted' });

    await page.goto(url.edit(id));

    await expect(page.locator('#field-restrictedCollapsibleText')).toHaveCount(0);
  });

  describe('restricted collection', () => {
    let existingDoc: ReadOnlyCollection;

    beforeAll(async () => {
      existingDoc = await payload.create({
        collection: readOnlySlug,
        data: {
          name: 'name',
        },
      });
    });

    test('should not show in card list', async () => {
      await page.goto(url.admin);
      await expect(page.locator(`#card-${restrictedSlug}`)).toHaveCount(0);
    });

    test('should not show in nav', async () => {
      await page.goto(url.admin);
      await expect(page.locator('.nav >> a:has-text("Restricteds")')).toHaveCount(0);
    });

    test('should not have list url', async () => {
      await page.goto(restrictedUrl.list);
      await expect(page.locator('.unauthorized')).toBeVisible();
    });

    test('should not have create url', async () => {
      await page.goto(restrictedUrl.create);
      await expect(page.locator('.unauthorized')).toBeVisible();
    });

    test('should not have access to existing doc', async () => {
      await page.goto(restrictedUrl.edit(existingDoc.id));
      await expect(page.locator('.unauthorized')).toBeVisible();
    });
  });

  describe('read-only collection', () => {
    let existingDoc: ReadOnlyCollection;

    beforeAll(async () => {
      existingDoc = await payload.create({
        collection: readOnlySlug,
        data: {
          name: 'name',
        },
      });
    });

    test('should show in card list', async () => {
      await page.goto(url.admin);
      await expect(page.locator(`#card-${readOnlySlug}`)).toHaveCount(1);
    });

    test('should show in nav', async () => {
      await page.goto(url.admin);
      await expect(page.locator(`.nav a[href="/admin/collections/${readOnlySlug}"]`)).toHaveCount(1);
    });

    test('should have collection url', async () => {
      await page.goto(readOnlyUrl.list);
      await expect(page).toHaveURL(readOnlyUrl.list); // no redirect
    });

    test('should not have "Create New" button', async () => {
      await page.goto(readOnlyUrl.create);
      await expect(page.locator('.collection-list__header a')).toHaveCount(0);
    });

    test('should not have quick create button', async () => {
      await page.goto(url.admin);
      await expect(page.locator(`#card-${readOnlySlug}`)).not.toHaveClass('card__actions');
    });

    test('edit view should not have actions buttons', async () => {
      await page.goto(readOnlyUrl.edit(existingDoc.id));
      await expect(page.locator('.collection-edit__collection-actions li')).toHaveCount(0);
    });

    test('fields should be read-only', async () => {
      await page.goto(readOnlyUrl.edit(existingDoc.id));
      await expect(page.locator('#field-name')).toBeDisabled();
    });
  });

  describe('readVersions', () => {
    let existingDoc: RestrictedVersion;

    beforeAll(async () => {
      existingDoc = await payload.create({
        collection: restrictedVersionsSlug,
        data: {
          name: 'name',
        },
      });
    });

    test('versions sidebar should not show', async () => {
      await page.goto(restrictedVersionsUrl.edit(existingDoc.id));
      await expect(page.locator('.versions-count')).toBeHidden();
    });
  });

  describe('doc level access', () => {
    let existingDoc: ReadOnlyCollection;
    let docLevelAccessURL;

    beforeAll(async () => {
      docLevelAccessURL = new AdminUrlUtil(serverURL, docLevelAccessSlug);

      existingDoc = await payload.create<any>({
        collection: docLevelAccessSlug,
        data: {
          approvedTitle: 'Title',
          lockTitle: true,
          approvedForRemoval: false,
        },
      });
    });

    test('disable field based on document data', async () => {
      await page.goto(docLevelAccessURL.edit(existingDoc.id));

      // validate that the text input is disabled because the field is "locked"
      const isDisabled = await page.locator('#field-approvedTitle').isDisabled();
      expect(isDisabled).toBe(true);
    });

    test('disable operation based on document data', async () => {
      await page.goto(docLevelAccessURL.edit(existingDoc.id));

      // validate that the delete action is not displayed
      const duplicateAction = page.locator('.collection-edit__collection-actions >> li').last();
      await expect(duplicateAction).toContainText('Duplicate');

      await page.locator('#field-approvedForRemoval + button').click();
      await page.locator('#action-save').click();

      const deleteAction = page.locator('.collection-edit__collection-actions >> li').last();
      await expect(deleteAction).toContainText('Delete');
    });
  });
});

async function createDoc(data: any): Promise<{ id: string }> {
  return payload.create({
    collection: docLevelAccessSlug,
    data,
  });
}
