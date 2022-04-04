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
      const filePath = path.resolve(
        __dirname,
        '../../../admin/assets/images/generic-block-image.svg',
      );
      const { size } = fs.statSync(filePath);

      const result: Media = await payload.create({
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

      const result: Media = await payload.update({
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

  describe('Read with Hidden Fields', () => {
    it('should allow a document with nested hidden fields to be retrieved with hidden fields shown.', async () => {
      const demoHiddenField = 'this is going to be hidden';

      const result = await payload.create({
        collection: 'localized-posts',
        data: {
          title: 'this post has a hidden field present',
          description: 'desc',
          priority: 1,
          nonLocalizedGroup: {
            text: '40w5g534gw34j',
          },
          localizedGroup: {
            text: '34lijgw45ligjw4li5j',
            demoHiddenField,
          },
        },
      });

      expect(result.id).toBeDefined();
      expect(result.localizedGroup).toBeDefined();
      expect(result.localizedGroup.demoHiddenField).toBeUndefined();

      const withHiddenFields = await payload.findByID({
        collection: 'localized-posts',
        id: result.id,
        showHiddenFields: true,
      });

      expect(withHiddenFields.localizedGroup.demoHiddenField).toStrictEqual(demoHiddenField);
      expect(withHiddenFields.id).toStrictEqual(result.id);
    });

    it('should allow a document with a relationship to a document with hidden fields to read the related document hidden fields', async () => {
      const demoHiddenField = 'this is going to be hidden';

      const relationshipA = await payload.create({
        collection: 'relationship-a',
        data: {
          demoHiddenField,
        },
      });

      expect(relationshipA.id).toBeDefined();
      expect(relationshipA.demoHiddenField).toBeUndefined();

      const relationshipB = await payload.create({
        collection: 'relationship-b',
        data: {
          title: 'pretty clever name here',
          post: [relationshipA.id],
        },
      });

      expect(relationshipB.id).toBeDefined();

      const relationshipBWithHiddenNestedField = await payload.findByID({
        collection: 'relationship-b',
        id: relationshipB.id,
        showHiddenFields: true,
      });

      expect(relationshipBWithHiddenNestedField.post[0].demoHiddenField).toStrictEqual(
        demoHiddenField,
      );
    });
    describe('Find', () => {
      const title = 'local-find';
      beforeAll(async (done) => {
        const data = {
          title,
          description: 'a description',
          priority: 1,
          nonLocalizedGroup: {
            text: 'english',
          },
          localizedGroup: {
            text: 'english',
          },
          nonLocalizedArray: [
            {
              localizedEmbeddedText: 'english',
            },
          ],
          richTextBlocks: [
            {
              blockType: 'richTextBlock',
              blockName: 'Test Block Name',
              content: [
                {
                  children: [{ text: 'english' }],
                },
              ],
            },
          ],
        };
        await payload.create({
          collection: 'localized-posts',
          data,
        });
        Array.from(Array(10).keys()).map(async (i) => {
          const uniqueTitle = `${title}-${i}`;
          await payload.create({
            collection: 'localized-posts',
            data: {
              ...data,
              title: uniqueTitle,
            },
          });
        });
        done();
      });
      it('should find collection with query', async () => {
        const result = await payload.find({
          collection: 'localized-posts',
          where: {
            title: {
              equals: title,
            },
          },
        });
        const doc = result.docs[0];
        expect(doc.id).toBeDefined();
        expect(doc.title).toStrictEqual(title);
      });
      it('should allow disable pagination to return all docs', async () => {
        const result = await payload.find({
          collection: 'localized-posts',
          pagination: false,
          limit: 5, // limit will not be used
        });
        expect(result.docs.length).toBeGreaterThan(10);
      });
    });
  });
});

interface ImageSize {
  url?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  filesize?: number;
  filename?: string;
}

interface Media {
  id?: string;
  filename?: string;
  filesize?: number;
  width?: number;
  height?: number;
  sizes?: {
    maintainedAspectRatio?: ImageSize;
    tablet?: ImageSize;
    mobile?: ImageSize;
    icon?: ImageSize;
  };
  alt: string;
}
