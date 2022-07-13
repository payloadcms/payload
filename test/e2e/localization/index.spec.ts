import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import payload from '../../../src';
import type { TypeWithTimestamps } from '../../../src/collections/config/types';
import { mapAsync } from '../../../src/utilities/mapAsync';
import { AdminUrlUtil } from '../../helpers/adminUrlUtil';
import { initPayloadTest } from '../../helpers/configHelpers';
import { firstRegister, saveDocAndAssert } from '../helpers';
import type { LocalizedPost } from './config';
import { slug } from './config';

/**
 * TODO: Localization
 * - [x] create doc in spanish locale
 * - [x] retrieve doc in spanish locale
 * - [x] retrieve doc in default locale, check for null fields
 * - add translations in english to spanish doc
 * - [x] check locale toggle button
 *
 * Fieldtypes to test: (collections for each field type)
 *  - localized and non-localized: array, block, group, relationship, text
 *
 * Repeat above for Globals
 */

const { beforeAll, describe, afterEach } = test;
let url: AdminUrlUtil;

const defaultLocale = 'en';
const title = 'english title';
const spanishTitle = 'spanish title';
const description = 'description';

let page: Page;
describe('Localization', () => {
  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadTest({
      __dirname,
      init: {
        local: false,
      },
    });

    await clearDocs(); // Clear any seeded data from onInit

    url = new AdminUrlUtil(serverURL, slug);

    const context = await browser.newContext();
    page = await context.newPage();

    await firstRegister({ page, serverURL });
  });

  afterEach(async () => {
    await clearDocs();
  });

  describe('localized text', () => {
    test('create english post, switch to spanish', async () => {
      await page.goto(url.create);

      await fillValues({ title, description });
      await saveDocAndAssert(page);

      // Change back to English
      await changeLocale('es');

      // Localized field should not be populated
      await expect(page.locator('#title')).toBeEmpty();
      await expect(page.locator('#description')).toHaveValue(description);

      await fillValues({ title: spanishTitle, description });
      await saveDocAndAssert(page);
      await changeLocale(defaultLocale);

      // Expect english title
      await expect(page.locator('#title')).toHaveValue(title);
      await expect(page.locator('#description')).toHaveValue(description);
    });

    test('create spanish post, add english', async () => {
      await page.goto(url.create);

      const newLocale = 'es';

      // Change to Spanish
      await changeLocale(newLocale);

      await fillValues({ title: spanishTitle, description });
      await saveDocAndAssert(page);

      // Change back to English
      await changeLocale(defaultLocale);

      // Localized field should not be populated
      await expect(page.locator('#title')).toBeEmpty();
      await expect(page.locator('#description')).toHaveValue(description);

      // Add English

      await fillValues({ title, description });
      await saveDocAndAssert(page);
      await saveDocAndAssert(page);

      await expect(page.locator('#title')).toHaveValue(title);
      await expect(page.locator('#description')).toHaveValue(description);
    });
  });
});

async function clearDocs(): Promise<void> {
  const allDocs = await payload.find<LocalizedPost>({ collection: slug, limit: 100 });
  const ids = allDocs.docs.map((doc) => doc.id);
  await mapAsync(ids, async (id) => {
    await payload.delete({ collection: slug, id });
  });
}

async function fillValues(data: Partial<Omit<LocalizedPost, keyof TypeWithTimestamps>>) {
  const { title: titleVal, description: descVal } = data;

  if (titleVal) await page.locator('#title').fill(titleVal);
  if (descVal) await page.locator('#description').fill(descVal);
}

async function changeLocale(newLocale: string) {
  await page.locator('.localizer >> button').first().click();
  await page.locator(`.localizer >> a:has-text("${newLocale}")`).click();
  expect(page.url()).toContain(`locale=${newLocale}`);
}
