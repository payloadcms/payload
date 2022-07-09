import { expect, Page, test } from '@playwright/test';
import payload from '../../../src';
import { AdminUrlUtil } from '../../helpers/adminUrlUtil';
import { initPayloadTest } from '../../helpers/configHelpers';
import { firstRegister, saveDocAndAssert } from '../helpers';
import { Post, slug } from './config';
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

  test('should nav to list', async () => {
    await page.goto(url.admin);
    const collectionLink = page.locator(`nav >> text=${slug}`);
    await collectionLink.click();

    expect(page.url()).toContain(url.collection);
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

      await page.goto(url.doc(id));

      await expect(page.locator('#title')).toHaveValue(title);
      await expect(page.locator('#description')).toHaveValue(description);
    });

    test('should delete existing', async () => {
      const { id } = await createPost();

      await page.goto(url.doc(id));
      await page.locator('.delete-document__toggle').click();
      await page.locator('button >> text=Confirm').click();

      await expect(page.locator(`text=Post "${id}" successfully deleted.`)).toBeVisible();
      expect(page.url()).toContain(url.collection);
    });
  });

  describe('list view', () => {
    beforeEach(async () => {
      await page.goto(url.collection);
    });

    describe('filtering', () => {
      test('toggle columns', async () => {
        const columnCountLocator = 'table >> thead >> tr >> th';
        await createPost();
        page.locator('.list-controls__toggle-columns').click({ delay: 100 });
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

      test('search by id', async () => {
        const { id } = await createPost();
        await page.locator('.search-filter__input').fill(id);
        const tableItems = page.locator('table >> tbody >> tr');
        await expect(tableItems).toHaveCount(1);
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
        const tableItems = page.locator('table >> tbody >> tr');

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
        const getTableItems = () => page.locator('table >> tbody >> tr');

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
