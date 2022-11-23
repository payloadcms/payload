import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import payload from '../../src';
import { mapAsync } from '../../src/utilities/mapAsync';
import { AdminUrlUtil } from '../helpers/adminUrlUtil';
import { initPayloadE2E } from '../helpers/configHelpers';
import { login, saveDocAndAssert } from '../helpers';
import type {
  FieldsRelationship as CollectionWithRelationships,
  RelationOne,
  RelationRestricted,
  RelationTwo,
  RelationWithTitle,
} from './config';
import { relationOneSlug, relationRestrictedSlug, relationTwoSlug, relationUpdatedExternallySlug, relationWithTitleSlug, slug } from './collectionSlugs';
import wait from '../../src/utilities/wait';

const { beforeAll, beforeEach, describe } = test;


describe('fields - relationship', () => {
  let url: AdminUrlUtil;
  let page: Page;
  let relationOneDoc: RelationOne;
  let anotherRelationOneDoc: RelationOne;
  let relationTwoDoc: RelationTwo;

  let docWithExistingRelations: CollectionWithRelationships;
  let restrictedRelation: RelationRestricted;
  let relationWithTitle: RelationWithTitle;
  let serverURL: string;

  beforeAll(async ({ browser }) => {
    const { serverURL: serverURLFromConfig } = await initPayloadE2E(__dirname);
    serverURL = serverURLFromConfig;

    url = new AdminUrlUtil(serverURL, slug);

    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page, serverURL });
  });

  beforeEach(async () => {
    await clearAllDocs();

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

    // Doc with useAsTitle for word boundary test
    await payload.create<RelationWithTitle>({
      collection: relationWithTitleSlug,
      data: {
        name: 'word boundary search',
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
  });

  test('should create relationship', async () => {
    await page.goto(url.create);

    const field = page.locator('#field-relationship');

    await field.click({ delay: 100 });

    const options = page.locator('.rs__option');

    await expect(options).toHaveCount(2); // two docs

    // Select a relationship
    await options.nth(0).click();
    await expect(field).toContainText(relationOneDoc.id);

    await saveDocAndAssert(page);
  });

  test('should create hasMany relationship', async () => {
    await page.goto(url.create);

    const field = page.locator('#field-relationshipHasMany');
    await field.click({ delay: 100 });

    const options = page.locator('.rs__option');

    await expect(options).toHaveCount(2); // Two relationship options

    // Add one relationship
    await options.locator(`text=${relationOneDoc.id}`).click();
    await expect(field).toContainText(relationOneDoc.id);
    await expect(field).not.toContainText(anotherRelationOneDoc.id);

    // Add second relationship
    await field.click({ delay: 100 });
    await options.locator(`text=${anotherRelationOneDoc.id}`).click();
    await expect(field).toContainText(anotherRelationOneDoc.id);

    // No options left
    await field.locator('.rs__input').click({ delay: 100 });
    await expect(page.locator('.rs__menu')).toHaveText('No options');

    await saveDocAndAssert(page);
  });

  test('should create relations to multiple collections', async () => {
    await page.goto(url.create);

    const field = page.locator('#field-relationshipMultiple');

    await field.click({ delay: 100 });

    const options = page.locator('.rs__option');

    await expect(options).toHaveCount(3); // 3 docs

    // Add one relationship
    await options.locator(`text=${relationOneDoc.id}`).click();
    await expect(field).toContainText(relationOneDoc.id);

    // Add relationship of different collection
    await field.click({ delay: 100 });
    await options.locator(`text=${relationTwoDoc.id}`).click();
    await expect(field).toContainText(relationTwoDoc.id);

    await saveDocAndAssert(page);
  });

  test('should duplicate document with relationships', async () => {
    await page.goto(url.edit(docWithExistingRelations.id));

    await page.locator('.btn.duplicate').first().click();
    await expect(page.locator('.Toastify')).toContainText('successfully');
    const field = page.locator('#field-relationship .rs__value-container');

    await expect(field).toHaveText(relationOneDoc.id);
  });

  test('should allow dynamic filterOptions', async () => {
    await page.goto(url.edit(docWithExistingRelations.id));

    // fill the first relation field
    let field = page.locator('#field-relationship');
    await field.click({ delay: 100 });
    const options = page.locator('.rs__option');
    await options.nth(0).click();
    await expect(field).toContainText(relationOneDoc.id);

    // then verify that the filtered field's options match
    let filteredField = page.locator('#field-relationshipFiltered .react-select');
    await filteredField.click({ delay: 100 });
    const filteredOptions = filteredField.locator('.rs__option');
    await expect(filteredOptions).toHaveCount(1); // one doc
    await filteredOptions.nth(0).click();
    await expect(filteredField).toContainText(relationOneDoc.id);

    // change the first relation field
    await field.click({ delay: 100 });
    await options.nth(1).click();
    await expect(field).toContainText(anotherRelationOneDoc.id);

    // then verify that the filtered field's options match
    filteredField = page.locator('#field-relationshipFiltered .react-select');
    await filteredField.click({ delay: 100 });
    await expect(filteredOptions).toHaveCount(2); // two options because the currently selected option is still there
    await filteredOptions.nth(1).click();
    await expect(filteredField).toContainText(anotherRelationOneDoc.id);
  });

  describe('existing relationships', () => {
    test('should highlight existing relationship', async () => {
      await page.goto(url.edit(docWithExistingRelations.id));

      const field = page.locator('#field-relationship');

      // Check dropdown options
      await field.click({ delay: 100 });

      await expect(page.locator('.rs__option--is-selected')).toHaveCount(1);
      await expect(page.locator('.rs__option--is-selected')).toHaveText(relationOneDoc.id);
    });

    test('should show untitled ID on restricted relation', async () => {
      await page.goto(url.edit(docWithExistingRelations.id));

      const field = page.locator('#field-relationshipRestricted');

      // Check existing relationship has untitled ID
      await expect(field).toContainText(`Untitled - ID: ${restrictedRelation.id}`);

      // Check dropdown options
      await field.click({ delay: 100 });
      const options = page.locator('.rs__option');

      await expect(options).toHaveCount(1); // None + 1 Unitled ID
    });

    // test.todo('should paginate within the dropdown');

    test('should search within the relationship field', async () => {
      await page.goto(url.edit(docWithExistingRelations.id));
      const input = page.locator('#field-relationshipWithTitle input');
      await input.fill('title');
      const options = page.locator('#field-relationshipWithTitle .rs__menu .rs__option');
      await expect(options).toHaveCount(1);

      await input.fill('non-occuring-string');
      await expect(options).toHaveCount(0);
    });

    test('should search using word boundaries within the relationship field', async () => {
      await page.goto(url.edit(docWithExistingRelations.id));
      const input = page.locator('#field-relationshipWithTitle input');
      await input.fill('word search');
      const options = page.locator('#field-relationshipWithTitle .rs__menu .rs__option');
      await expect(options).toHaveCount(1);
    });

    test('should show useAsTitle on relation', async () => {
      await page.goto(url.edit(docWithExistingRelations.id));

      const field = page.locator('#field-relationshipWithTitle .react-select');

      // Check existing relationship for correct title
      await expect(field).toHaveText(relationWithTitle.name);

      await field.click({ delay: 100 });
      const options = page.locator('.rs__option');

      await expect(options).toHaveCount(2);
    });

    test('should show id on relation in list view', async () => {
      await page.goto(url.list);
      await wait(110);
      const relationship = page.locator('.row-1 .cell-relationship');
      await expect(relationship).toHaveText(relationOneDoc.id);
    });

    test('should show Untitled ID on restricted relation in list view', async () => {
      await page.goto(url.list);
      await wait(110);
      const relationship = page.locator('.row-1 .cell-relationshipRestricted');
      await expect(relationship).toContainText('Untitled - ID: ');
    });

    test('should show useAsTitle on relation in list view', async () => {
      await page.goto(url.list);
      await wait(110);
      const relationship = page.locator('.row-1 .cell-relationshipWithTitle');
      await expect(relationship).toHaveText(relationWithTitle.name);
    });
  });

  describe('externally update field', () => {
    beforeAll(async () => {
      url = new AdminUrlUtil(serverURL, relationUpdatedExternallySlug);
      await page.goto(url.create);
    });

    test('has many, one collection', async () => {
      await page.goto(url.create);

      await page.locator('#field-relationHasMany + .pre-populate-field-ui button').click();
      await wait(300);

      expect(await page.locator('#field-relationHasMany .rs__value-container > .rs__multi-value').count()).toEqual(15);
    });

    test('has many, many collections', async () => {
      await page.locator('#field-relationToManyHasMany + .pre-populate-field-ui button').click();
      await wait(300);

      expect(await page.locator('#field-relationToManyHasMany .rs__value-container > .rs__multi-value').count()).toEqual(15);
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
