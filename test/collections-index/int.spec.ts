import mongoose from 'mongoose';
import {initPayloadTest} from '../helpers/configHelpers';
import {slug} from './config';
import payload from '../../src';
import type {SevenEleven} from './payload-types';
import {mapAsync} from '../../src/utilities/mapAsync';

type ColorType='red'|'black'|undefined;

describe('collections-index', () => {
  beforeAll(async () => {
    const {serverURL}=await initPayloadTest({__dirname, init: {local: false}});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await payload.mongoMemoryServer.stop();
  });

  beforeEach(async () => {
    await clearDocs();
  });

  describe('CRUD', () => {
    it('should create', async () => {
      const data={
        uid: 1004,
        name: 'tomato',
        domain: 'a',
        color: 'red' as ColorType
      };
      await createItem(data);
    });

    it('should duplicate', async () => {
      const data={
        uid: 1004,
        name: 'tomato',
        domain: 'a',
        color: 'red' as ColorType
      };
      await createItem(data);
    });
  });
});

async function createItem(overrides?: Partial<SevenEleven>) {
  await payload.create({
    collection: slug,
    data: {...overrides},
  });
}


async function clearDocs(): Promise<void> {
  const allDocs=await payload.find({collection: slug, limit: 100});
  const ids=allDocs.docs.map((doc) => doc.id);
  await mapAsync(ids, async (id) => {
    await payload.delete({collection: slug, id});
  });
}
