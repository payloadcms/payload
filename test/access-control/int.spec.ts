import mongoose from 'mongoose';
import payload from '../../src';
import { Forbidden } from '../../src/errors';
import { initPayloadTest } from '../helpers/configHelpers';
import { restrictedSlug, siblingDataSlug, slug } from './config';
import type { Restricted, Post, SiblingDatum } from './payload-types';
import { firstArrayText, secondArrayText } from './shared';

describe('Access Control', () => {
  let post1: Post;
  let restricted: Restricted;

  beforeAll(async () => {
    await initPayloadTest({ __dirname });
  });

  beforeEach(async () => {
    post1 = await payload.create<Post>({
      collection: slug,
      data: { name: 'name' },
    });

    restricted = await payload.create<Restricted>({
      collection: restrictedSlug,
      data: { name: 'restricted' },
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await payload.mongoMemoryServer.stop();
  });

  it.todo('should properly prevent / allow public users from reading a restricted field');

  it('should be able to restrict access based upon siblingData', async () => {
    const { id } = await payload.create<SiblingDatum>({
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

    const doc = await payload.findByID<SiblingDatum>({
      id,
      collection: siblingDataSlug,
      overrideAccess: false,
    });

    expect(doc.array?.[0].text).toBe(firstArrayText);
    // Should respect PublicReadabilityAccess function and not be sent
    expect(doc.array?.[1].text).toBeUndefined();

    // Retrieve with default of overriding access
    const docOverride = await payload.findByID<SiblingDatum>({
      id,
      collection: siblingDataSlug,
    });

    expect(docOverride.array?.[0].text).toBe(firstArrayText);
    expect(docOverride.array?.[1].text).toBe(secondArrayText);
  });

  describe('Collections', () => {
    describe('restricted collection', () => {
      it('field without read access should not show', async () => {
        const { id } = await createDoc({ restrictedField: 'restricted' });

        const retrievedDoc = await payload.findByID({ collection: slug, id, overrideAccess: false });

        expect(retrievedDoc.restrictedField).toBeUndefined();
      });

      it('field without read access should not show when overrideAccess: true', async () => {
        const { id, restrictedField } = await createDoc({ restrictedField: 'restricted' });

        const retrievedDoc = await payload.findByID({ collection: slug, id, overrideAccess: true });

        expect(retrievedDoc.restrictedField).toEqual(restrictedField);
      });

      it('field without read access should not show when overrideAccess default', async () => {
        const { id, restrictedField } = await createDoc({ restrictedField: 'restricted' });

        const retrievedDoc = await payload.findByID({ collection: slug, id });

        expect(retrievedDoc.restrictedField).toEqual(restrictedField);
      });
    });
  });

  describe('Override Access', () => {
    describe('Fields', () => {
      it('should allow overrideAccess: false', async () => {
        const req = async () => payload.update<Post>({
          collection: slug,
          id: post1.id,
          data: { restrictedField: restricted.id },
          overrideAccess: false, // this should respect access control
        });

        await expect(req).rejects.toThrow(Forbidden);
      });

      it('should allow overrideAccess: true', async () => {
        const doc = await payload.update<Post>({
          collection: slug,
          id: post1.id,
          data: { restrictedField: restricted.id },
          overrideAccess: true, // this should override access control
        });

        expect(doc).toMatchObject({ id: post1.id });
      });

      it('should allow overrideAccess by default', async () => {
        const doc = await payload.update<Post>({
          collection: slug,
          id: post1.id,
          data: { restrictedField: restricted.id },
        });

        expect(doc).toMatchObject({ id: post1.id });
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
    });
  });
});

async function createDoc(data: Partial<Post>): Promise<Post> {
  return payload.create({
    collection: slug,
    data: data ?? {},
  });
}
