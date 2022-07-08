import { expect, Page, test } from '@playwright/test';
import payload from '../../../src';
import { AdminUrlUtil } from '../../helpers/adminUrlUtil';
import { initPayloadTest } from '../../helpers/configHelpers';
import { firstRegister } from '../helpers';
import { Post, slug } from './config';
import { mapAsync } from '../../../src/utilities/mapAsync';

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

      await expect(page.locator('text=Post successfully created')).toBeVisible();
      expect(page.url()).not.toContain('create');

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
  const allDocs = await payload.find<Post>({ collection: slug });
  const ids = allDocs.docs.map((doc) => doc.id);
  await mapAsync(ids, async (id) => {
    await payload.delete({ collection: slug, id });
  });
}
