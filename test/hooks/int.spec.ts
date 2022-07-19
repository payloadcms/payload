import mongoose from 'mongoose';
import { initPayloadTest } from '../helpers/configHelpers';
import config from './config';
import payload from '../../src';
import { RESTClient } from '../helpers/rest';
import type { Post } from './payload-types';
import { mapAsync } from '../../src/utilities/mapAsync';
import { transformSlug } from './collections/Transform';
import { hooksSlug } from './collections/Hook';

let client: RESTClient;

describe('Hooks', () => {
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } });
    client = new RESTClient(config, { serverURL, defaultSlug: transformSlug });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await payload.mongoMemoryServer.stop();
  });

  beforeEach(async () => {
    await clearDocs();
  });

  describe('transform actions', () => {
    it('should create and not throw an error', async () => {
      // the collection has hooks that will cause an error if transform actions is not handled properly
      const doc = await payload.create({
        collection: transformSlug,
        data: {
          transform: [2, 8],
          localizedTransform: [2, 8],
        },
      });

      expect(doc.transform).toBeDefined();
      expect(doc.localizedTransform).toBeDefined();
    });
  });

  describe('hook execution', () => {
    let doc;
    it('should execute hooks in correct order on create', async () => {
      doc = await payload.create({
        collection: hooksSlug,
        data: {
          fieldBeforeValidate: false,
          collectionBeforeValidate: false,
          fieldBeforeChange: false,
          collectionBeforeChange: false,
          fieldAfterChange: false,
          collectionAfterChange: false,
          collectionBeforeRead: false,
          fieldAfterRead: false,
          collectionAfterRead: false,
        },
      });

      expect(doc.fieldBeforeValidate).toEqual(true);
      expect(doc.collectionBeforeValidate).toEqual(true);
      expect(doc.fieldBeforeChange).toEqual(true);
      expect(doc.collectionBeforeChange).toEqual(true);
      expect(doc.fieldAfterChange).toEqual(true);
      expect(doc.collectionAfterChange).toEqual(true);
      expect(doc.fieldAfterRead).toEqual(true);
    });
  });
});

async function clearDocs(): Promise<void> {
  const allDocs = await payload.find<Post>({ collection: transformSlug, limit: 100 });
  const ids = allDocs.docs.map((doc) => doc.id);
  await mapAsync(ids, async (id) => {
    await payload.delete({ collection: transformSlug, id });
  });
}
