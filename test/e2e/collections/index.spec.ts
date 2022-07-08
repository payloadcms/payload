import { test, expect, Page } from '@playwright/test';
import payload from '../../../src';
import { initPayloadTest } from '../../helpers/configHelpers';
import { firstRegister } from '../helpers';
import { Post, slug } from './config';

const { beforeAll, describe } = test;

let serverURL: string;

const title = 'title';
const description = 'description';

describe('collections', () => {
  let page: Page;

  beforeAll(async ({ browser }) => {
    // Go to the starting url before each test.
    ({ serverURL } = await initPayloadTest({
      __dirname,
      init: {
        local: false,
      },
    }));

    const context = await browser.newContext();
    page = await context.newPage();

    await firstRegister({ page, serverURL });
  });

  test('should nav to list', async () => {
    await page.goto(`${serverURL}/admin`);
    const collectionLink = page.locator('nav >> text=Posts');
    await collectionLink.click();

    expect(page.url()).toContain(`${serverURL}/admin/collections/${slug}`);
  });

  test('should create', async () => {
    await page.goto(`${serverURL}/admin/collections/${slug}/create`);
    await page.locator('#title').fill(title);
    await page.locator('#description').fill(description);
    await page.click('text=Save', { delay: 100 });

    await expect(page.locator('text=Post successfully created')).toBeVisible();
    expect(page.url()).not.toContain('create');

    await expect(page.locator('#title')).toHaveValue(title);
    await expect(page.locator('#description')).toHaveValue(description);
  });

  test('should read existing', async () => {
    const { id } = await payload.create<Post>({
      collection: slug,
      data: {
        title,
        description,
      },
    });

    await page.goto(`${serverURL}/admin/collections/${slug}/${id}`);

    await expect(page.locator('#title')).toHaveValue(title);
    await expect(page.locator('#description')).toHaveValue(description);
  });

  test('should delete existing', async () => {
    const { id } = await payload.create<Post>({
      collection: slug,
      data: {
        title,
        description,
      },
    });

    await page.goto(`${serverURL}/admin/collections/${slug}/${id}`);
    await page.locator('.delete-document__toggle').click();
    await page.locator('button >> text=Confirm').click();

    await expect(page.locator(`text=Post "${id}" successfully deleted.`)).toBeVisible();
    expect(page.url()).toContain(`${serverURL}/admin/collections/${slug}`);
  });
});
