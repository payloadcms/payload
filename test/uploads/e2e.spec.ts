import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import path from 'path';
import { relationSlug, mediaSlug } from './config';
import type { Media } from './payload-types';
import payload from '../../src';
import { AdminUrlUtil } from '../helpers/adminUrlUtil';
import { initPayloadE2E } from '../helpers/configHelpers';
import { login, saveDocAndAssert } from '../helpers';
import wait from '../../src/utilities/wait';

const { beforeAll, describe } = test;

let mediaURL: AdminUrlUtil;
let relationURL: AdminUrlUtil;

describe('uploads', () => {
  let page: Page;
  let mediaDoc: Media;

  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadE2E(__dirname);

    mediaURL = new AdminUrlUtil(serverURL, mediaSlug);
    relationURL = new AdminUrlUtil(serverURL, relationSlug);

    const context = await browser.newContext();
    page = await context.newPage();

    const findMedia = await payload.find({
      collection: mediaSlug,
      depth: 0,
      pagination: false,
    });
    mediaDoc = findMedia.docs[0] as Media;

    await login({ page, serverURL });
  });

  test('should see upload filename in relation list', async () => {
    await page.goto(relationURL.list);

    await wait(110);
    const field = page.locator('.cell-image');

    await expect(field).toContainText('image.png');
  });

  test('should show upload filename in upload collection list', async () => {
    await page.goto(mediaURL.list);

    const media = page.locator('.thumbnail-card__label');
    await wait(110);

    await expect(media).toHaveText('image.png');
  });

  test('should create file upload', async () => {
    await page.goto(mediaURL.create);

    await page.setInputFiles('input[type="file"]', path.resolve(__dirname, './image.png'));

    const filename = page.locator('.file-field__filename');

    await expect(filename).toContainText('.png');

    await saveDocAndAssert(page);
  });

  test('should show resized images', async () => {
    await page.goto(mediaURL.edit(mediaDoc.id));

    await page.locator('.btn.file-details__toggle-more-info').click();

    const maintainedAspectRatioMeta = page.locator('.file-details__sizes .file-meta').nth(0);
    await expect(maintainedAspectRatioMeta).toContainText('1024x1024');

    const differentFormatFromMainImageMeta = page.locator('.file-details__sizes .file-meta').nth(1);
    await expect(differentFormatFromMainImageMeta).toContainText('image/jpeg');

    const tabletMeta = page.locator('.file-details__sizes .file-meta').nth(2);
    await expect(tabletMeta).toContainText('640x480');

    const mobileMeta = page.locator('.file-details__sizes .file-meta').nth(3);
    await expect(mobileMeta).toContainText('320x240');

    const iconMeta = page.locator('.file-details__sizes .file-meta').nth(4);
    await expect(iconMeta).toContainText('16x16');
  });
});
