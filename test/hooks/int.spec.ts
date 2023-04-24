import mongoose from 'mongoose';
import { initPayloadTest } from '../helpers/configHelpers';
import config from './config';
import payload from '../../src';
import { RESTClient } from '../helpers/rest';
import { transformSlug } from './collections/Transform';
import { hooksSlug } from './collections/Hook';
import { chainingHooksSlug } from './collections/ChainingHooks';
import { generatedAfterReadText, nestedAfterReadHooksSlug } from './collections/NestedAfterReadHooks';
import { relationsSlug } from './collections/Relations';
import type { NestedAfterReadHook } from './payload-types';
import { hooksUsersSlug } from './collections/Users';
import { devUser, regularUser } from '../credentials';
import { AuthenticationError } from '../../src/errors';

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

    it('should save data generated with afterRead hooks in nested field structures', async () => {
      const document = await payload.create<NestedAfterReadHook>({
        collection: nestedAfterReadHooksSlug,
        data: {
          text: 'ok',
          group: {
            array: [
              { input: 'input' },
            ],
          },
        },
      });

      expect(document.group.subGroup.afterRead).toEqual(generatedAfterReadText);
      expect(document.group.array[0].afterRead).toEqual(generatedAfterReadText);
    });

    it('should populate related docs within nested field structures', async () => {
      const relation = await payload.create({
        collection: relationsSlug,
        data: {
          title: 'Hello',
        },
      });

      const document = await payload.create({
        collection: nestedAfterReadHooksSlug,
        data: {
          text: 'ok',
          group: {
            array: [
              {
                shouldPopulate: relation.id,
              },
            ],
            subGroup: {
              shouldPopulate: relation.id,
            },
          },
        },
      });

      const retrievedDoc = await payload.findByID({
        collection: nestedAfterReadHooksSlug,
        id: document.id,
      });

      expect(retrievedDoc.group.array[0].shouldPopulate.title).toEqual(relation.title);
      expect(retrievedDoc.group.subGroup.shouldPopulate.title).toEqual(relation.title);
    });

    it('should pass result from previous hook into next hook with findByID', async () => {
      const document = await payload.create({
        collection: chainingHooksSlug,
        data: {
          text: 'ok',
        },
      });

      const retrievedDoc = await payload.findByID({
        collection: chainingHooksSlug,
        id: document.id,
      });

      expect(retrievedDoc.text).toEqual('ok!!');
    });

    it('should pass result from previous hook into next hook with find', async () => {
      const document = await payload.create({
        collection: chainingHooksSlug,
        data: {
          text: 'ok',
        },
      });

      const { docs: retrievedDocs } = await payload.find({
        collection: chainingHooksSlug,
      });

      expect(retrievedDocs[0].text).toEqual('ok!!');
    });
  });

  describe('auth collection hooks', () => {
    it('allow admin login', async () => {
      const { user } = await payload.login({
        collection: hooksUsersSlug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      });
      expect(user).toBeDefined();
    });

    it('deny user login', async () => {
      await expect(() => payload.login({ collection: hooksUsersSlug, data: { email: regularUser.email, password: regularUser.password } })).rejects.toThrow(AuthenticationError);
    });
  });
});
