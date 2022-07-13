import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import payload from '../../../src';
import { AdminUrlUtil } from '../../helpers/adminUrlUtil';
import { initPayloadTest } from '../../helpers/configHelpers';
import { firstRegister, saveDocAndAssert } from '../helpers';
import type { Post } from './config';
import { slug } from './config';
import { mapAsync } from '../../../src/utilities/mapAsync';
import wait from '../../../src/utilities/wait';

const { afterEach, beforeAll, beforeEach, describe } = test;

const title = 'title';
const description = 'description';

let url: AdminUrlUtil;

describe('collections', () => {
  let page: Page;

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

  describe('Nav', () => {
    test('should nav to collection - sidebar', async () => {
      await page.goto(url.admin);
      const collectionLink = page.locator(`nav >> text=${slug}`);
      await collectionLink.click();

      expect(page.url()).toContain(url.list);
    });

    test('should navigate to collection - card', async () => {
      await page.goto(url.admin);
      await page.locator('a:has-text("Posts")').click();
      expect(page.url()).toContain(url.list);
    });

    test('breadcrumbs - from card to dashboard', async () => {
      await page.goto(url.list);
      await page.locator('a:has-text("Dashboard")').click();
      expect(page.url()).toContain(url.admin);
    });

    test('breadcrumbs - from document to collection', async () => {
      const { id } = await createPost();

      await page.goto(url.edit(id));
      await page.locator('nav >> text=Posts').click();
      expect(page.url()).toContain(url.list);
    });
  });


  describe('CRUD', () => {
    test('should create', async () => {
      await page.goto(url.create);
      await page.locator('#title').fill(title);
      await page.locator('#description').fill(description);
      await page.click('text=Save', { delay: 100 });

      await saveDocAndAssert(page);

      await expect(page.locator('#title')).toHaveValue(title);
      await expect(page.locator('#description')).toHaveValue(description);
    });

    test('should read existing', async () => {
      const { id } = await createPost();

      await page.goto(url.edit(id));

      await expect(page.locator('#title')).toHaveValue(title);
      await expect(page.locator('#description')).toHaveValue(description);
    });

    test('should update existing', async () => {
      const { id } = await createPost();

      await page.goto(url.edit(id));

      const newTitle = 'new title';
      const newDesc = 'new description';
      await page.locator('#title').fill(newTitle);
      await page.locator('#description').fill(newDesc);

      await saveDocAndAssert(page);

      await expect(page.locator('#title')).toHaveValue(newTitle);
      await expect(page.locator('#description')).toHaveValue(newDesc);
    });

    test('should delete existing', async () => {
      const { id } = await createPost();

      await page.goto(url.edit(id));
      await page.locator('button:has-text("Delete")').click();
      await page.locator('button:has-text("Confirm")').click();

      await expect(page.locator(`text=Post "${id}" successfully deleted.`)).toBeVisible();
      expect(page.url()).toContain(url.list);
    });

    test('should duplicate existing', async () => {
      const { id } = await createPost();

      await page.goto(url.edit(id));
      await page.locator('button:has-text("Duplicate")').click();

      expect(page.url()).toContain(url.create);
      await page.locator('button:has-text("Save")').click();
      expect(page.url()).not.toContain(id); // new id
    });
  });

  describe('list view', () => {
    const tableRowLocator = 'table >> tbody >> tr';

    beforeEach(async () => {
      await page.goto(url.list);
    });

    describe('filtering', () => {
      test('search by id', async () => {
        const { id } = await createPost();
        await page.locator('.search-filter__input').fill(id);
        const tableItems = page.locator(tableRowLocator);
        await expect(tableItems).toHaveCount(1);
      });

      test('toggle columns', async () => {
        const columnCountLocator = 'table >> thead >> tr >> th';
        await createPost();
        await page.locator('button:has-text("Columns")').click();
        await wait(1000); // Wait for column toggle UI, should probably use waitForSelector

        const numberOfColumns = await page.locator(columnCountLocator).count();
        const idButton = page.locator('.column-selector >> text=ID');

        // Remove ID column
        await idButton.click({ delay: 100 });
        await expect(page.locator(columnCountLocator)).toHaveCount(numberOfColumns - 1);

        // Add back ID column
        await idButton.click({ delay: 100 });
        await expect(page.locator(columnCountLocator)).toHaveCount(numberOfColumns);
      });

      test('filter rows', async () => {
        const { id } = await createPost({ title: 'post1' });
        await createPost({ title: 'post2' });

        await expect(page.locator(tableRowLocator)).toHaveCount(2);

        await page.locator('button:has-text("Filters")').click();
        await wait(1000); // Wait for column toggle UI, should probably use waitForSelector

        await page.locator('text=Add filter').click();

        const operatorField = page.locator('.condition >> .condition__operator');
        const valueField = page.locator('.condition >> .condition__value >> input');

        await operatorField.click();

        const dropdownOptions = operatorField.locator('.rs__option');
        await dropdownOptions.locator('text=equals').click();

        await valueField.fill(id);
        await wait(1000);

        await expect(page.locator(tableRowLocator)).toHaveCount(1);
        const firstId = await page.locator(tableRowLocator).first().locator('td').first()
          .innerText();
        expect(firstId).toEqual(id);

        // Remove filter
        await page.locator('.condition >> .icon--x').click();
        await wait(1000);
        await expect(page.locator(tableRowLocator)).toHaveCount(2);
      });
    });

    describe('pagination', () => {
      beforeAll(async () => {
        await mapAsync([...Array(11)], async () => {
          await createPost();
        });
      });

      test('should paginate', async () => {
        const pageInfo = page.locator('.collection-list__page-info');
        const perPage = page.locator('.per-page');
        const paginator = page.locator('.paginator');
        const tableItems = page.locator(tableRowLocator);

        await expect(tableItems).toHaveCount(10);
        await expect(pageInfo).toHaveText('1-10 of 11');
        await expect(perPage).toContainText('Per Page: 10');

        // Forward one page and back using numbers
        await paginator.locator('button').nth(1).click();
        expect(page.url()).toContain('?page=2');
        await expect(tableItems).toHaveCount(1);
        await paginator.locator('button').nth(0).click();
        expect(page.url()).toContain('?page=1');
        await expect(tableItems).toHaveCount(10);
      });
    });

    describe('sorting', () => {
      beforeAll(async () => {
        [1, 2].map(async () => {
          await createPost();
        });
      });

      test('should sort', async () => {
        const getTableItems = () => page.locator(tableRowLocator);

        await expect(getTableItems()).toHaveCount(2);

        const chevrons = page.locator('table >> thead >> th >> button');
        const upChevron = chevrons.first();
        const downChevron = chevrons.nth(1);

        const getFirstId = async () => getTableItems().first().locator('td').first()
          .innerText();
        const getSecondId = async () => getTableItems().nth(1).locator('td').first()
          .innerText();

        const firstId = await getFirstId();
        const secondId = await getSecondId();

        await upChevron.click({ delay: 100 });

        // Order should have swapped
        expect(await getFirstId()).toEqual(secondId);
        expect(await getSecondId()).toEqual(firstId);

        await downChevron.click({ delay: 100 });

        // Swap back
        expect(await getFirstId()).toEqual(firstId);
        expect(await getSecondId()).toEqual(secondId);
      });
    });
  });
});

async function createPost(overrides?: Partial<Post>): Promise<Post> {
  return payload.create<Post>({
    collection: slug,
    data: {
      title,
      description,
      ...overrides,
    },
  });
}

async function clearDocs(): Promise<void> {
  const allDocs = await payload.find<Post>({ collection: slug, limit: 100 });
  const ids = allDocs.docs.map((doc) => doc.id);
  await mapAsync(ids, async (id) => {
    await payload.delete({ collection: slug, id });
  });
}
