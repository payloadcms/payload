import mongoose from 'mongoose';
import payload from '../../src';
import { Forbidden } from '../../src/errors';
import { initPayloadTest } from '../helpers/configHelpers';
import { restrictedSlug, slug } from './config';
import type { Restricted, Post } from './payload-types';

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
