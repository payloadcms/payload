import { expect, Page, test } from '@playwright/test';
import payload from '../../../src';
import { mapAsync } from '../../../src/utilities/mapAsync';
import { AdminUrlUtil } from '../../helpers/adminUrlUtil';
import { initPayloadTest } from '../../helpers/configHelpers';
import { firstRegister, saveDocAndAssert } from '../helpers';
import { FieldsRelationship, RelationOne, relationOneSlug, RelationTwo, relationTwoSlug, slug } from './config';

const { beforeAll, describe } = test;

let url: AdminUrlUtil;

describe('fields - relationship', () => {
  let page: Page;
  let relationOneDoc: RelationOne;
  let anotherRelationOneDoc: RelationOne;
  let relationTwoDoc: RelationTwo;

  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadTest({
      __dirname,
      init: {
        local: false,
      },
    });
    await clearDocs();

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

    await firstRegister({ page, serverURL });
  });

  test('should create relationship', async () => {
    await page.goto(url.create);

    const fields = page.locator('.render-fields >> .react-select');
    const relationshipField = fields.nth(0);

    await relationshipField.click({ delay: 100 });

    const options = page.locator('.render-fields >> .react-select >> .rs__option');

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

    const options = page.locator('.render-fields >> .react-select >> .rs__option');

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

    const options = page.locator('.rs__group >> .rs__option');

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
});

async function clearDocs(): Promise<void> {
  const allDocs = await payload.find<FieldsRelationship>({ collection: slug, limit: 100 });
  const ids = allDocs.docs.map((doc) => doc.id);
  await mapAsync(ids, async (id) => {
    await payload.delete({ collection: slug, id });
  });
  const relationOneDocs = await payload.find<FieldsRelationship>({ collection: relationOneSlug, limit: 100 });
  const relationOneIds = relationOneDocs.docs.map((doc) => doc.id);
  await mapAsync(relationOneIds, async (id) => {
    await payload.delete({ collection: relationOneSlug, id });
  });
}
