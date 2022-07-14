import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import payload from '../../../src';
import { mapAsync } from '../../../src/utilities/mapAsync';
import { AdminUrlUtil } from '../../helpers/adminUrlUtil';
import { initPayloadTest } from '../../helpers/configHelpers';
import { login, saveDocAndAssert } from '../helpers';
import type {
  FieldsRelationship as CollectionWithRelationships,
  RelationOne,
  RelationRestricted,
  RelationTwo,
  RelationWithTitle,
} from './config';
import {
  relationOneSlug,
  relationRestrictedSlug,
  relationTwoSlug,
  relationWithTitleSlug,
  slug,
} from './config';
import wait from '../../../src/utilities/wait';

const { beforeAll, describe } = test;

let url: AdminUrlUtil;

describe('fields - relationship', () => {
  let page: Page;
  let relationOneDoc: RelationOne;
  let anotherRelationOneDoc: RelationOne;
  let relationTwoDoc: RelationTwo;

  let docWithExistingRelations: CollectionWithRelationships;
  let restrictedRelation: RelationRestricted;
  let relationWithTitle: RelationWithTitle;

  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadTest({
      __dirname,
      init: {
        local: false,
      },
    });
    await clearAllDocs();

    url = new AdminUrlUtil(serverURL, slug);

    const context = await browser.newContext();
    page = await context.newPage();

    // Create docs to relate to
    relationOneDoc = await payload.create<RelationOne>({
      collection: relationOneSlug,
      data: {
        name: 'relation',
      },
    });

    anotherRelationOneDoc = await payload.create<RelationOne>({
      collection: relationOneSlug,
      data: {
        name: 'relation',
      },
    });

    relationTwoDoc = await payload.create<RelationTwo>({
      collection: relationTwoSlug,
      data: {
        name: 'second-relation',
      },
    });

    // Create restricted doc
    restrictedRelation = await payload.create<RelationRestricted>({
      collection: relationRestrictedSlug,
      data: {
        name: 'restricted',
      },
    });

    // Doc with useAsTitle
    relationWithTitle = await payload.create<RelationWithTitle>({
      collection: relationWithTitleSlug,
      data: {
        name: 'relation-title',
      },
    });

    // Add restricted doc as relation
    docWithExistingRelations = await payload.create<CollectionWithRelationships>({
      collection: slug,
      data: {
        name: 'with-existing-relations',
        relationship: relationOneDoc.id,
        relationshipRestricted: restrictedRelation.id,
        relationshipWithTitle: relationWithTitle.id,
      },
    });

    await login({ page, serverURL });
  });

  test('should create relationship', async () => {
    await page.goto(url.create);

    const fields = page.locator('.render-fields >> .react-select');
    const relationshipField = fields.nth(0);

    await relationshipField.click({ delay: 100 });

    const options = page.locator('.rs__option');

    await expect(options).toHaveCount(3); // None + two docs

    // Select a relationship
    await options.nth(1).click();
    await expect(relationshipField).toContainText(relationOneDoc.id);

    await saveDocAndAssert(page);
  });

  test('should create hasMany relationship', async () => {
    await page.goto(url.create);

    const fields = page.locator('.render-fields >> .react-select');
    const relationshipHasManyField = fields.nth(1);

    await relationshipHasManyField.click({ delay: 100 });

    const options = page.locator('.rs__option');

    await expect(options).toHaveCount(2); // Two relationship options

    // Add one relationship
    await options.locator(`text=${relationOneDoc.id}`).click();
    await expect(relationshipHasManyField).toContainText(relationOneDoc.id);
    await expect(relationshipHasManyField).not.toContainText(anotherRelationOneDoc.id);

    // Add second relationship
    await relationshipHasManyField.click({ delay: 100 });
    await options.locator(`text=${anotherRelationOneDoc.id}`).click();
    await expect(relationshipHasManyField).toContainText(anotherRelationOneDoc.id);

    // No options left
    await relationshipHasManyField.click({ delay: 100 });
    await expect(page.locator('.rs__menu')).toHaveText('No options');

    await saveDocAndAssert(page);
  });

  test('should create relations to multiple collections', async () => {
    await page.goto(url.create);

    const fields = page.locator('.render-fields >> .react-select');
    const relationshipMultipleField = fields.nth(2);

    await relationshipMultipleField.click({ delay: 100 });

    const options = page.locator('.rs__option');

    await expect(options).toHaveCount(4); // None + 3 docs

    // Add one relationship
    await options.locator(`text=${relationOneDoc.id}`).click();
    await expect(relationshipMultipleField).toContainText(relationOneDoc.id);

    // Add relationship of different collection
    await relationshipMultipleField.click({ delay: 100 });
    await options.locator(`text=${relationTwoDoc.id}`).click();
    await expect(relationshipMultipleField).toContainText(relationTwoDoc.id);

    await saveDocAndAssert(page);
  });

  describe('existing relationships', () => {
    test('should highlight existing relationship', async () => {
      await page.goto(url.edit(docWithExistingRelations.id));

      const fields = page.locator('.render-fields >> .react-select');
      const relationOneField = fields.nth(0);

      // Check dropdown options
      await relationOneField.click({ delay: 100 });

      await expect(page.locator('.rs__option--is-selected')).toHaveCount(1);
      await expect(page.locator('.rs__option--is-selected')).toHaveText(relationOneDoc.id);
    });

    test('should show untitled ID on restricted relation', async () => {
      await page.goto(url.edit(docWithExistingRelations.id));

      const fields = page.locator('.render-fields >> .react-select');
      const restrictedRelationField = fields.nth(3);

      // Check existing relationship has untitled ID
      await expect(restrictedRelationField).toContainText(`Untitled - ID: ${restrictedRelation.id}`);

      // Check dropdown options
      await restrictedRelationField.click({ delay: 100 });
      const options = page.locator('.rs__option');

      await expect(options).toHaveCount(2); // None + 1 Unitled ID
    });

    test('should show useAsTitle on relation', async () => {
      await page.goto(url.edit(docWithExistingRelations.id));

      const fields = page.locator('.render-fields >> .react-select');
      const relationWithTitleField = fields.nth(4);

      // Check existing relationship for correct title
      await expect(relationWithTitleField).toHaveText(relationWithTitle.name);

      await relationWithTitleField.click({ delay: 100 });
      const options = page.locator('.rs__option');

      await expect(options).toHaveCount(2); // None + 1 Doc
    });

    test('should show id on relation in list view', async () => {
      await page.goto(url.list);
      await wait(1000);
      const cells = page.locator('.relationship');
      const relationship = cells.nth(0);
      await expect(relationship).toHaveText(relationOneDoc.id);
    });

    test('should show useAsTitle on relation in list view', async () => {
      await page.goto(url.list);
      wait(110);
      const cells = page.locator('.relationshipWithTitle');
      const relationship = cells.nth(0);
      await expect(relationship).toHaveText(relationWithTitle.id);
    });

    test('should show untitled ID on restricted relation in list view', async () => {
      await page.goto(url.list);
      wait(110);
      const cells = page.locator('.relationship');
      const relationship = cells.nth(0);
      await expect(relationship).toHaveText(relationOneDoc.id);
    });
  });
});

async function clearAllDocs(): Promise<void> {
  await clearCollectionDocs(slug);
  await clearCollectionDocs(relationOneSlug);
  await clearCollectionDocs(relationTwoSlug);
  await clearCollectionDocs(relationRestrictedSlug);
  await clearCollectionDocs(relationWithTitleSlug);
}

async function clearCollectionDocs(collectionSlug: string): Promise<void> {
  const ids = (await payload.find({ collection: collectionSlug, limit: 100 })).docs.map((doc) => doc.id);
  await mapAsync(ids, async (id) => {
    await payload.delete({ collection: collectionSlug, id });
  });
}
