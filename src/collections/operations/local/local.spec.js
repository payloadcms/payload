import fs from 'fs';
import path from 'path';
import payload from '../../..';

let createdMediaID;

payload.init({
  secret: 'SECRET_KEY',
  mongoURL: 'mongodb://localhost/payload',
  local: true,
});

describe('Collections - Local', () => {
  describe('Create', () => {
    it('should allow an upload-enabled file to be created and uploaded', async () => {
      const alt = 'Alt Text Here';
      const filePath = path.resolve(__dirname, '../../../admin/assets/images/generic-block-image.svg');
      const { size } = fs.statSync(filePath);

      const result = await payload.create({
        collection: 'media',
        data: {
          alt,
        },
        filePath,
      });

      expect(result.id).toBeDefined();
      expect(result.alt).toStrictEqual(alt);
      expect(result.filename).toStrictEqual('generic-block-image.svg');
      expect(result.filesize).toStrictEqual(size);
      createdMediaID = result.id;
    });
  });

  describe('Update', () => {
    it('should allow an upload-enabled file to be re-uploaded and alt-text to be changed.', async () => {
      const newAltText = 'New Alt Text Here';

      const result = await payload.update({
        collection: 'media',
        id: createdMediaID,
        data: {
          alt: newAltText,
        },
        filePath: path.resolve(__dirname, '../../../admin/assets/images/og-image.png'),
      });

      expect(result.alt).toStrictEqual(newAltText);
      expect(result.sizes.mobile.width).toStrictEqual(320);
      expect(result.width).toStrictEqual(640);
    });
  });
});
