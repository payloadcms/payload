import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { promisify } from 'util';
import { initPayloadTest } from '../helpers/configHelpers';
import { RESTClient } from '../helpers/rest';
import configPromise, { mediaSlug, relationSlug } from './config';
import payload from '../../src';
import getFileByPath from '../../src/uploads/getFileByPath';

const stat = promisify(fs.stat);

require('isomorphic-fetch');

let client;

describe('Collections - Uploads', () => {
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } });
    const config = await configPromise;
    client = new RESTClient(config, { serverURL, defaultSlug: mediaSlug });
    await client.login();
  });

  describe('REST', () => {
    describe('create', () => {
      it('creates from form data given a png', async () => {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(path.join(__dirname, './image.png')));

        const { status, doc } = await client.create({
          file: true,
          data: formData,
          auth: true,
          headers: {},
        });

        expect(status).toBe(201);

        // Check for files
        expect(await fileExists(path.join(__dirname, './media', doc.filename))).toBe(true);
        expect(await fileExists(path.join(__dirname, './media', doc.sizes.maintainedAspectRatio.filename))).toBe(true);
        expect(await fileExists(path.join(__dirname, './media', doc.sizes.tablet.filename))).toBe(true);
        expect(await fileExists(path.join(__dirname, './media', doc.sizes.mobile.filename))).toBe(true);
        expect(await fileExists(path.join(__dirname, './media', doc.sizes.icon.filename))).toBe(true);

        // Check api response
        expect(doc.mimeType).toEqual('image/png');
        expect(doc.sizes.maintainedAspectRatio.url).toContain('/media/image');
        expect(doc.sizes.maintainedAspectRatio.url).toContain('.png');
        expect(doc.sizes.maintainedAspectRatio.width).toEqual(1024);
        expect(doc.sizes.maintainedAspectRatio.height).toEqual(1024);
        expect(doc.sizes).toHaveProperty('tablet');
        expect(doc.sizes).toHaveProperty('mobile');
        expect(doc.sizes).toHaveProperty('icon');
      });

      it('creates from form data given an svg', async () => {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(path.join(__dirname, './image.svg')));

        const { status, doc } = await client.create({
          file: true,
          data: formData,
          auth: true,
          headers: {},
        });

        expect(status).toBe(201);

        // Check for files
        expect(await fileExists(path.join(__dirname, './media', doc.filename))).toBe(true);

        // Check api response
        expect(doc.mimeType).toEqual('image/svg+xml');
        expect(doc.sizes.maintainedAspectRatio.url).toBeUndefined();
        expect(doc.width).toBeDefined();
        expect(doc.height).toBeDefined();
      });
    });

    it('creates images that do not require all sizes', async () => {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(path.join(__dirname, './small.png')));

      const { status, doc } = await client.create({
        file: true,
        data: formData,
        auth: true,
        headers: {},
      });

      expect(status).toBe(201);

      // Check for files
      expect(await fileExists(path.join(__dirname, './media', doc.filename))).toBe(true);
      expect(await fileExists(path.join(__dirname, './media', 'small-640x480.png'))).toBe(false);
      expect(await fileExists(path.join(__dirname, './media', doc.sizes.icon.filename))).toBe(true);

      // Check api response
      expect(doc.sizes.tablet.filename).toBeNull();
      expect(doc.sizes.icon.filename).toBeDefined();
    });

    it('creates images from a different format', async () => {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(path.join(__dirname, './image.jpg')));

      const { status, doc } = await client.create({
        file: true,
        data: formData,
        auth: true,
        headers: {},
      });

      expect(status).toBe(201);

      // Check for files
      expect(await fileExists(path.join(__dirname, './media', doc.filename))).toBe(true);
      expect(await fileExists(path.join(__dirname, './media', doc.sizes.tablet.filename))).toBe(true);

      // Check api response
      expect(doc.filename).toContain('.png');
      expect(doc.mimeType).toEqual('image/png');
      expect(doc.sizes.maintainedAspectRatio.filename).toContain('.png');
      expect(doc.sizes.maintainedAspectRatio.mimeType).toContain('image/png');
      expect(doc.sizes.differentFormatFromMainImage.filename).toContain('.jpg');
      expect(doc.sizes.differentFormatFromMainImage.mimeType).toContain('image/jpeg');
    });

    it('creates media without storing a file', async () => {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(path.join(__dirname, './small.png')));

      // unstored media
      const { status, doc } = await client.create({
        slug: 'unstored-media',
        file: true,
        data: formData,
        auth: true,
        headers: {},
      });

      expect(status).toBe(201);

      // Check for files
      expect(await !fileExists(path.join(__dirname, './media', doc.filename))).toBe(false);

      // Check api response
      expect(doc.filename).toBeDefined();
    });
  });

  it('update', async () => {
    // Create image
    const filePath = path.resolve(__dirname, './image.png');
    const file = await getFileByPath(filePath);
    file.name = 'renamed.png';

    const mediaDoc = await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    });

    const formData = new FormData();
    formData.append('file', fs.createReadStream(path.join(__dirname, './small.png')));

    const { status } = await client.update({
      id: mediaDoc.id,
      file: true,
      data: formData,
      auth: true,
      headers: {},
    });

    expect(status).toBe(200);

    // Check that previously existing files were removed
    expect(await fileExists(path.join(__dirname, './media', mediaDoc.filename))).toBe(true);
    expect(await fileExists(path.join(__dirname, './media', mediaDoc.sizes.icon.filename))).toBe(true);
  });

  it('should remove existing media on re-upload', async () => {
    // Create temp file
    const filePath = path.resolve(__dirname, './temp.png');
    const file = await getFileByPath(filePath);
    file.name = 'temp.png';

    const mediaDoc = await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    });

    // Check that the temp file was created
    expect(await fileExists(path.join(__dirname, './media', mediaDoc.filename))).toBe(true);

    // Replace the temp file with a new one
    const newFilePath = path.resolve(__dirname, './temp-renamed.png');
    const newFile = await getFileByPath(newFilePath);
    newFile.name = 'temp-renamed.png';

    const updatedMediaDoc = await payload.update({
      collection: mediaSlug,
      id: mediaDoc.id,
      file: newFile,
      data: {},
    });

    // Check that the replacement file was created and the old one was removed
    expect(await fileExists(path.join(__dirname, './media', updatedMediaDoc.filename))).toBe(true);
    expect(await fileExists(path.join(__dirname, './media', mediaDoc.filename))).toBe(false);
  });

  it('should remove extra sizes on update', async () => {
    const filePath = path.resolve(__dirname, './image.png');
    const file = await getFileByPath(filePath);
    const small = await getFileByPath(path.resolve(__dirname, './small.png'));

    const { id } = await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    });

    const doc = await payload.update({
      collection: mediaSlug,
      id,
      data: {},
      file: small,
    });

    expect(doc.sizes.icon).toBeDefined();
    expect(doc.sizes.tablet.width).toBeNull();
  });

  it('should allow update removing a relationship', async () => {
    const filePath = path.resolve(__dirname, './image.png');
    const file = await getFileByPath(filePath);
    file.name = 'renamed.png';

    const { id } = await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    });

    const related = await payload.create({
      collection: relationSlug,
      data: {
        image: id,
      },
    });

    const doc = await payload.update({
      collection: relationSlug,
      id: related.id,
      data: {
        image: null,
      },
    });

    expect(doc.image).toBeNull();
  });

  it('delete', async () => {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(path.join(__dirname, './image.png')));

    const { doc } = await client.create({
      file: true,
      data: formData,
      auth: true,
      headers: {},
    });

    const { status } = await client.delete(doc.id, {
      auth: true,
    });

    expect(status).toBe(200);

    expect(await fileExists(path.join(__dirname, doc.filename))).toBe(false);
  });
});

async function fileExists(fileName: string): Promise<boolean> {
  try {
    await stat(fileName);
    return true;
  } catch (err) {
    return false;
  }
}
