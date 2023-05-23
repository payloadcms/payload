import mongoose from 'mongoose';
import payload from '../../src';
import { Forbidden } from '../../src/errors';
import type { PayloadRequest } from '../../src/types';
import { initPayloadTest } from '../helpers/configHelpers';
import {
  hiddenAccessSlug,
  hiddenFieldsSlug,
  relyOnRequestHeadersSlug,
  requestHeaders,
  restrictedSlug,
  restrictedVersionsSlug,
  siblingDataSlug,
  slug,
} from './config';
import type { Post, RelyOnRequestHeader, Restricted } from './payload-types';
import { firstArrayText, secondArrayText } from './shared';

describe('Access Control', () => {
  let post1: Post;
  let restricted: Restricted;

  beforeAll(async () => {
    await initPayloadTest({ __dirname });
  });

  beforeEach(async () => {
    post1 = await payload.create({
      collection: slug,
      data: { name: 'name' },
    });

    restricted = await payload.create({
      collection: restrictedSlug,
      data: { name: 'restricted' },
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await payload.mongoMemoryServer.stop();
  });

  it('should not affect hidden fields when patching data', async () => {
    const doc = await payload.create({
      collection: hiddenFieldsSlug,
      data: {
        partiallyHiddenArray: [{
          name: 'public_name',
          value: 'private_value',
        }],
        partiallyHiddenGroup: {
          name: 'public_name',
          value: 'private_value',
        },
      },
    });

    await payload.update({
      collection: hiddenFieldsSlug,
      id: doc.id,
      data: {
        title: 'Doc Title',
      },
    });

    const updatedDoc = await payload.findByID({
      collection: hiddenFieldsSlug,
      id: doc.id,
      showHiddenFields: true,
    });

    expect(updatedDoc.partiallyHiddenGroup.value).toEqual('private_value');
    expect(updatedDoc.partiallyHiddenArray[0].value).toEqual('private_value');
  });

  it('should not affect hidden fields when patching data - update many', async () => {
    const docsMany = await payload.create({
      collection: hiddenFieldsSlug,
      data: {
        partiallyHiddenArray: [{
          name: 'public_name',
          value: 'private_value',
        }],
        partiallyHiddenGroup: {
          name: 'public_name',
          value: 'private_value',
        },
      },
    });

    await payload.update({
      collection: hiddenFieldsSlug,
      where: {
        id: { equals: docsMany.id },
      },
      data: {
        title: 'Doc Title',
      },
    });

    const updatedMany = await payload.findByID({
      collection: hiddenFieldsSlug,
      id: docsMany.id,
      showHiddenFields: true,
    });

    expect(updatedMany.partiallyHiddenGroup.value).toEqual('private_value');
    expect(updatedMany.partiallyHiddenArray[0].value).toEqual('private_value');
  });

  it('should be able to restrict access based upon siblingData', async () => {
    const { id } = await payload.create({
      collection: siblingDataSlug,
      data: {
        array: [
          {
            text: firstArrayText,
            allowPublicReadability: true,
          },
          {
            text: secondArrayText,
            allowPublicReadability: false,
          },
        ],
      },
    });

    const doc = await payload.findByID({
      id,
      collection: siblingDataSlug,
      overrideAccess: false,
    });

    expect(doc.array?.[0].text).toBe(firstArrayText);
    // Should respect PublicReadabilityAccess function and not be sent
    expect(doc.array?.[1].text).toBeUndefined();

    // Retrieve with default of overriding access
    const docOverride = await payload.findByID({
      id,
      collection: siblingDataSlug,
    });

    expect(docOverride.array?.[0].text).toBe(firstArrayText);
    expect(docOverride.array?.[1].text).toBe(secondArrayText);
  });

  describe('Collections', () => {
    describe('restricted collection', () => {
      it('field without read access should not show', async () => {
        const { id } = await createDoc<Post>({ restrictedField: 'restricted' });

        const retrievedDoc = await payload.findByID({ collection: slug, id, overrideAccess: false });

        expect(retrievedDoc.restrictedField).toBeUndefined();
      });

      it('field without read access should not show when overrideAccess: true', async () => {
        const { id, restrictedField } = await createDoc<Post>({ restrictedField: 'restricted' });

        const retrievedDoc = await payload.findByID({ collection: slug, id, overrideAccess: true });

        expect(retrievedDoc.restrictedField).toEqual(restrictedField);
      });

      it('field without read access should not show when overrideAccess default', async () => {
        const { id, restrictedField } = await createDoc<Post>({ restrictedField: 'restricted' });

        const retrievedDoc = await payload.findByID({ collection: slug, id });

        expect(retrievedDoc.restrictedField).toEqual(restrictedField);
      });
    });
    describe('non-enumerated request properties passed to access control', () => {
      it('access control ok when passing request headers', async () => {
        const req = Object.defineProperty({}, 'headers', {
          value: requestHeaders,
          enumerable: false,
        }) as PayloadRequest;
        const name = 'name';
        const overrideAccess = false;

        const { id } = await createDoc<RelyOnRequestHeader>({ name }, relyOnRequestHeadersSlug, { req, overrideAccess });
        const docById = await payload.findByID({ collection: relyOnRequestHeadersSlug, id, req, overrideAccess });
        const { docs: docsByName } = await payload.find({
          collection: relyOnRequestHeadersSlug,
          where: {
            name: {
              equals: name,
            },
          },
          req,
          overrideAccess,
        });

        expect(docById).not.toBeUndefined();
        expect(docsByName.length).toBeGreaterThan(0);
      });

      it('access control fails when omitting request headers', async () => {
        const name = 'name';
        const overrideAccess = false;

        await expect(() => createDoc<RelyOnRequestHeader>({ name }, relyOnRequestHeadersSlug, { overrideAccess })).rejects.toThrow(Forbidden);
        const { id } = await createDoc<RelyOnRequestHeader>({ name }, relyOnRequestHeadersSlug);

        await expect(() => payload.findByID({ collection: relyOnRequestHeadersSlug, id, overrideAccess })).rejects.toThrow(Forbidden);

        await expect(() => payload.find({
          collection: relyOnRequestHeadersSlug,
          where: {
            name: {
              equals: name,
            },
          },
          overrideAccess,
        })).rejects.toThrow(Forbidden);
      });
    });
  });

  describe('Override Access', () => {
    describe('Fields', () => {
      it('should allow overrideAccess: false', async () => {
        const req = async () => payload.update({
          collection: slug,
          id: post1.id,
          data: { restrictedField: restricted.id },
          overrideAccess: false, // this should respect access control
        });

        await expect(req).rejects.toThrow(Forbidden);
      });

      it('should allow overrideAccess: true', async () => {
        const doc = await payload.update({
          collection: slug,
          id: post1.id,
          data: { restrictedField: restricted.id },
          overrideAccess: true, // this should override access control
        });

        expect(doc).toMatchObject({ id: post1.id });
      });

      it('should allow overrideAccess by default', async () => {
        const doc = await payload.update({
          collection: slug,
          id: post1.id,
          data: { restrictedField: restricted.id },
        });

        expect(doc).toMatchObject({ id: post1.id });
      });

      it('should allow overrideAccess: false - update many', async () => {
        const req = async () => payload.update({
          collection: slug,
          where: {
            id: { equals: post1.id },
          },
          data: { restrictedField: restricted.id },
          overrideAccess: false, // this should respect access control
        });

        await expect(req).rejects.toThrow(Forbidden);
      });

      it('should allow overrideAccess: true - update many', async () => {
        const doc = await payload.update({
          collection: slug,
          where: {
            id: { equals: post1.id },
          },
          data: { restrictedField: restricted.id },
          overrideAccess: true, // this should override access control
        });

        expect(doc.docs[0]).toMatchObject({ id: post1.id });
      });

      it('should allow overrideAccess by default - update many', async () => {
        const doc = await payload.update({
          collection: slug,
          where: {
            id: { equals: post1.id },
          },
          data: { restrictedField: restricted.id },
        });

        expect(doc.docs[0]).toMatchObject({ id: post1.id });
      });
    });

    describe('Collections', () => {
      const updatedName = 'updated';

      it('should allow overrideAccess: false', async () => {
        const req = async () => payload.update({
          collection: restrictedSlug,
          id: restricted.id,
          data: { name: updatedName },
          overrideAccess: false, // this should respect access control
        });

        await expect(req).rejects.toThrow(Forbidden);
      });

      it('should allow overrideAccess: true', async () => {
        const doc = await payload.update({
          collection: restrictedSlug,
          id: restricted.id,
          data: { name: updatedName },
          overrideAccess: true, // this should override access control
        });

        expect(doc).toMatchObject({ id: restricted.id, name: updatedName });
      });

      it('should allow overrideAccess by default', async () => {
        const doc = await payload.update({
          collection: restrictedSlug,
          id: restricted.id,
          data: { name: updatedName },
        });

        expect(doc).toMatchObject({ id: restricted.id, name: updatedName });
      });

      it('should allow overrideAccess: false - update many', async () => {
        const req = async () => payload.update({
          collection: restrictedSlug,
          where: {
            id: { equals: restricted.id },
          },
          data: { name: updatedName },
          overrideAccess: false, // this should respect access control
        });

        await expect(req).rejects.toThrow(Forbidden);
      });

      it('should allow overrideAccess: true - update many', async () => {
        const doc = await payload.update({
          collection: restrictedSlug,
          where: {
            id: { equals: restricted.id },
          },
          data: { name: updatedName },
          overrideAccess: true, // this should override access control
        });

        expect(doc.docs[0]).toMatchObject({ id: restricted.id, name: updatedName });
      });

      it('should allow overrideAccess by default - update many', async () => {
        const doc = await payload.update({
          collection: restrictedSlug,
          where: {
            id: { equals: restricted.id },
          },
          data: { name: updatedName },
        });

        expect(doc.docs[0]).toMatchObject({ id: restricted.id, name: updatedName });
      });
    });
  });

  describe('Querying', () => {
    it('should respect query constraint using hidden field', async () => {
      await payload.create({
        collection: hiddenAccessSlug,
        data: {
          title: 'hello',
        },
      });

      await payload.create({
        collection: hiddenAccessSlug,
        data: {
          title: 'hello',
          hidden: true,
        },
      });

      const { docs } = await payload.find({
        collection: hiddenAccessSlug,
        overrideAccess: false,
      });

      expect(docs).toHaveLength(1);
    });

    it('should respect query constraint using hidden field on versions', async () => {
      await payload.create({
        collection: restrictedVersionsSlug,
        data: {
          name: 'match',
          hidden: true,
        },
      });

      await payload.create({
        collection: restrictedVersionsSlug,
        data: {
          name: 'match',
          hidden: false,
        },
      });
      const { docs } = await payload.findVersions({
        where: {
          'version.name': { equals: 'match' },
        },
        collection: restrictedVersionsSlug,
        overrideAccess: false,
      });

      expect(docs).toHaveLength(1);
    });
  });
});

async function createDoc<Collection>(data: Partial<Collection>, overrideSlug = slug, options?: Partial<Collection>): Promise<Collection> {
  return payload.create({
    ...options,
    collection: overrideSlug,
    data: data ?? {},
  });
}
