import mongoose from 'mongoose';
import { initPayloadTest } from '../helpers/configHelpers';
import payload from '../../src';
import configPromise from './config';

let collection: string;

describe('array-update', () => {
  beforeAll(async () => {
    const config = await configPromise;
    collection = config.collections[0]?.slug;
    await initPayloadTest({ __dirname });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await payload.mongoMemoryServer.stop();
  });

  it('should persist existing array-based data while updating and passing row ID', async () => {
    const originalText = 'some optional text';

    const doc = await payload.create({
      collection,
      data: {
        array: [
          {
            required: 'a required field here',
            optional: originalText,
          },
          {
            required: 'another required field here',
            optional: 'this is cool',
          },
        ],
      },
    });

    const arrayWithExistingValues = [...doc.array];

    const updatedText = 'this is some new text for the first item in array';

    arrayWithExistingValues[0] = {
      id: arrayWithExistingValues[0].id,
      required: updatedText,
    };

    const updatedDoc = await payload.update({
      id: doc.id,
      collection,
      data: {
        array: arrayWithExistingValues,
      },
    });

    expect(updatedDoc.array?.[0]).toMatchObject({
      required: updatedText,
      optional: originalText,
    });
  });

  it('should disregard existing array-based data while updating and NOT passing row ID', async () => {
    const updatedText = 'here is some new text';

    const secondArrayItem = {
      required: 'test',
      optional: 'optional test',
    };

    const doc = await payload.create({
      collection,
      data: {
        array: [
          {
            required: 'a required field here',
            optional: 'some optional text',
          },
          secondArrayItem,
        ],
      },
    });

    const updatedDoc = await payload.update({
      id: doc.id,
      collection,
      data: {
        array: [
          {
            required: updatedText,
          },
          {
            id: doc.array?.[1].id,
            required: doc.array?.[1].required as string,
            // NOTE - not passing optional field. It should persist
            // because we're passing ID
          },
        ],
      },
    });

    expect(updatedDoc.array?.[0].required).toStrictEqual(updatedText);
    expect(updatedDoc.array?.[0].optional).toBeUndefined();

    expect(updatedDoc.array?.[1]).toMatchObject(secondArrayItem);
  });
});
