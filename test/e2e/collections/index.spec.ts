import { expect, Page, test } from '@playwright/test';
import payload from '../../../src';
import { AdminUrlUtil } from '../../helpers/adminUrlUtil';
import { initPayloadTest } from '../../helpers/configHelpers';
import { firstRegister } from '../helpers';
import { Post, slug } from './config';

const { beforeAll, describe } = test;

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
    url = new AdminUrlUtil(serverURL, slug);

    const context = await browser.newContext();
    page = await context.newPage();

    await firstRegister({ page, serverURL });
  });

  test('should nav to list', async () => {
    await page.goto(url.admin);
    const collectionLink = page.locator('nav >> text=Posts');
    await collectionLink.click();

    expect(page.url()).toContain(url.collection);
  });

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
    const { id } = await payload.create<Post>({
      collection: slug,
      data: {
        title,
        description,
      },
    });

    await page.goto(url.doc(id));

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

    await page.goto(url.doc(id));
    await page.locator('.delete-document__toggle').click();
    await page.locator('button >> text=Confirm').click();

    await expect(page.locator(`text=Post "${id}" successfully deleted.`)).toBeVisible();
    expect(page.url()).toContain(url.collection);
  });
});
