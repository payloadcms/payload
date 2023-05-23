import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import path from 'path';
import { relationSlug, mediaSlug, audioSlug } from './config';
import type { Media } from './payload-types';
import payload from '../../src';
import { AdminUrlUtil } from '../helpers/adminUrlUtil';
import { initPayloadE2E } from '../helpers/configHelpers';
import { login, saveDocAndAssert } from '../helpers';
import wait from '../../src/utilities/wait';

const { beforeAll, describe } = test;

let mediaURL: AdminUrlUtil;
let audioURL: AdminUrlUtil;
let relationURL: AdminUrlUtil;

describe('uploads', () => {
  let page: Page;
  let pngDoc: Media;
  let audioDoc: Media;

  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadE2E(__dirname);

    mediaURL = new AdminUrlUtil(serverURL, mediaSlug);
    audioURL = new AdminUrlUtil(serverURL, audioSlug);
    relationURL = new AdminUrlUtil(serverURL, relationSlug);

    const context = await browser.newContext();
    page = await context.newPage();

    const findPNG = await payload.find({
      collection: mediaSlug,
      depth: 0,
      pagination: false,
      where: {
        mimeType: {
          equals: 'image/png',
        },
      },
    });

    pngDoc = findPNG.docs[0] as Media;

    const findAudio = await payload.find({
      collection: audioSlug,
      depth: 0,
      pagination: false,
    });

    audioDoc = findAudio.docs[0] as Media;

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
    const audioUpload = page.locator('tr.row-1 .cell-filename');
    await expect(audioUpload).toHaveText('audio.mp3');

    const imageUpload = page.locator('tr.row-2 .cell-filename');
    await expect(imageUpload).toHaveText('image.png');
  });

  test('should create file upload', async () => {
    await page.goto(mediaURL.create);

    await page.setInputFiles('input[type="file"]', path.resolve(__dirname, './image.png'));

    const filename = page.locator('.file-field__filename');

    await expect(filename).toContainText('.png');

    await saveDocAndAssert(page);
  });

  test('should update file upload', async () => {
    await page.goto(mediaURL.edit(pngDoc.id));
  });

  test('should show resized images', async () => {
    await page.goto(mediaURL.edit(pngDoc.id));

    await page.locator('.btn.file-details__toggle-more-info').click();

    const maintainedAspectRatioMeta = page.locator('.file-details__sizes .file-meta').nth(0);
    await expect(maintainedAspectRatioMeta).toContainText('1024x1024');

    const differentFormatFromMainImageMeta = page.locator('.file-details__sizes .file-meta').nth(1);
    await expect(differentFormatFromMainImageMeta).toContainText('image/jpeg');

    const maintainedImageSizeMeta = page.locator('.file-details__sizes .file-meta').nth(2);
    await expect(maintainedImageSizeMeta).toContainText('1600x1600');

    const maintainedImageSizeWithNewFormatMeta = page.locator('.file-details__sizes .file-meta').nth(3);
    await expect(maintainedImageSizeWithNewFormatMeta).toContainText('image/jpeg');
    await expect(maintainedImageSizeWithNewFormatMeta).toContainText('1600x1600');

    const tabletMeta = page.locator('.file-details__sizes .file-meta').nth(4);
    await expect(tabletMeta).toContainText('640x480');

    const mobileMeta = page.locator('.file-details__sizes .file-meta').nth(5);
    await expect(mobileMeta).toContainText('320x240');

    const iconMeta = page.locator('.file-details__sizes .file-meta').nth(6);
    await expect(iconMeta).toContainText('16x16');
  });

  test('should restrict mimetype based on filterOptions', async () => {
    await page.goto(audioURL.edit(audioDoc.id));
    await wait(200);

    // remove the selection and open the list drawer
    await page.locator('.file-details__remove').click();
    await page.locator('.upload__toggler.list-drawer__toggler').click();
    const listDrawer = await page.locator('[id^=list-drawer_1_]');
    await expect(listDrawer).toBeVisible();
    await wait(200); // list is loading

    // ensure the only card is the audio file
    const rows = await listDrawer.locator('table tbody tr');
    expect(await rows.count()).toEqual(1);
    const filename = rows.locator('.cell-filename');
    await expect(filename).toHaveText('audio.mp3');

    // upload an image and try to select it
    await listDrawer.locator('button.list-drawer__create-new-button.doc-drawer__toggler').click();
    await expect(await page.locator('[id^=doc-drawer_media_2_]')).toBeVisible();
    await page.locator('[id^=doc-drawer_media_2_] .file-field__upload input[type="file"]').setInputFiles(path.resolve(__dirname, './image.png'));
    await page.locator('[id^=doc-drawer_media_2_] button#action-save').click();
    await wait(200);
    await expect(page.locator('.Toastify')).toContainText('successfully');

    // save the document and expect an error
    await page.locator('button#action-save').click();
    await wait(200);
    await expect(page.locator('.Toastify')).toContainText('The following field is invalid: audio');
  });
});
