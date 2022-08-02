import type { IndexDirection, IndexOptions } from 'mongoose';
import { initPayloadTest } from '../helpers/configHelpers';
import { RESTClient } from '../helpers/rest';
import config from '../uploads/config';
import payload from '../../src';
import { pointDoc } from './collections/Point';
import type { ArrayField, GroupField } from './payload-types';
import { arrayFieldsSlug, arrayDefaultValue, arrayDoc } from './collections/Array';
import { groupFieldsSlug, groupDefaultChild, groupDefaultValue, groupDoc } from './collections/Group';
import { defaultText } from './collections/Text';

let client;

describe('Fields', () => {
  beforeAll(async (done) => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } });
    client = new RESTClient(config, { serverURL, defaultSlug: 'point-fields' });
    await client.login();

    done();
  });

  describe('text', () => {
    let doc;
    const text = 'text field';
    beforeAll(async () => {
      doc = await payload.create({
        collection: 'text-fields',
        data: { text },
      });
    });

    it('creates with default values', () => {
      expect(doc.text).toEqual(text);
      expect(doc.defaultFunction).toEqual(defaultText);
      expect(doc.defaultAsync).toEqual(defaultText);
    });
  });

  describe('indexes', () => {
    let indexes;
    let textIndexDefinition;
    let uniqueIndexDefinition;
    let uniqueIndexOptions;
    let pointIndexDefinition;

    beforeAll(() => {
      indexes = payload.collections['indexed-fields'].Model.schema.indexes() as [Record<string, IndexDirection>, IndexOptions];

      indexes.forEach((index) => {
        if (index[0].text) {
          textIndexDefinition = index[0].text;
        }
        if (index[0].uniqueText) {
          uniqueIndexDefinition = index[0].uniqueText;
          // eslint-disable-next-line prefer-destructuring
          uniqueIndexOptions = index[1];
        }
        if (index[0].point) {
          pointIndexDefinition = index[0].point;
        }
      });
    });

    it('should have indexes', () => {
      expect(textIndexDefinition).toEqual(1);
    });
    it('should have unique indexes', () => {
      expect(uniqueIndexDefinition).toEqual(1);
      expect(uniqueIndexOptions).toMatchObject({ unique: true });
    });
    it('should point field geospatial indexes', () => {
      expect(pointIndexDefinition).toEqual('2dsphere');
    });
  });

  describe('point', () => {
    let doc;

    beforeAll(async () => {
      const findDoc = await payload.find({
        collection: 'point-fields',
        pagination: false,
      });
      [doc] = findDoc.docs;
    });

    it('should read', async () => {
      const find = await payload.find({
        collection: 'point-fields',
        pagination: false,
      });

      [doc] = find.docs;

      expect(doc.point).toEqual(pointDoc.point);
      expect(doc.localized).toEqual(pointDoc.localized);
      expect(doc.group).toMatchObject(pointDoc.group);
    });

    it('should create', async () => {
      const point = [7, -7];
      const localized = [5, -2];
      const group = { point: [1, 9] };
      doc = await payload.create({
        collection: 'point-fields',
        data: {
          point,
          localized,
          group,
        },
      });

      expect(doc.point).toEqual(point);
      expect(doc.localized).toEqual(localized);
      expect(doc.group).toMatchObject(group);
    });
  });
  describe('array', () => {
    let doc;
    const collection = arrayFieldsSlug;

    beforeAll(async () => {
      doc = await payload.create<ArrayField>({
        collection,
        data: {},
      });
    });

    it('should return empty array for arrays when no data present', async () => {
      const document = await payload.create<ArrayField>({
        collection: arrayFieldsSlug,
        data: arrayDoc,
      });

      expect(document.potentiallyEmptyArray).toEqual([]);
    });

    it('should create with ids and nested ids', async () => {
      const docWithIDs = await payload.create<GroupField>({
        collection: groupFieldsSlug,
        data: groupDoc,
      });
      expect(docWithIDs.group.subGroup.arrayWithinGroup[0].id).toBeDefined();
    });

    it('should create with defaultValue', async () => {
      expect(doc.items).toMatchObject(arrayDefaultValue);
      expect(doc.localized).toMatchObject(arrayDefaultValue);
    });

    it('should update without overwriting other locales with defaultValue', async () => {
      const localized = [{ text: 'unique' }];
      const enText = 'english';
      const esText = 'spanish';
      const { id } = await payload.create<ArrayField>({
        collection,
        data: {
          localized,
        },
      });

      const enDoc = await payload.update<ArrayField>({
        collection,
        id,
        locale: 'en',
        data: {
          localized: [{ text: enText }],
        },
      });

      const esDoc = await payload.update<ArrayField>({
        collection,
        id,
        locale: 'es',
        data: {
          localized: [{ text: esText }],
        },
      });

      const allLocales = await payload.findByID({
        collection,
        id,
        locale: 'all',
      }) as unknown as {localized: {en: unknown, es: unknown}};

      expect(enDoc.localized[0].text).toStrictEqual(enText);
      expect(esDoc.localized[0].text).toStrictEqual(esText);
      expect(allLocales.localized.en[0].text).toStrictEqual(enText);
      expect(allLocales.localized.es[0].text).toStrictEqual(esText);
    });
  });

  describe('group', () => {
    let document;

    beforeAll(async () => {
      document = await payload.create<GroupField>({
        collection: groupFieldsSlug,
        data: {},
      });
    });

    it('should create with defaultValue', async () => {
      expect(document.group.defaultParent).toStrictEqual(groupDefaultValue);
      expect(document.group.defaultChild).toStrictEqual(groupDefaultChild);
    });

    it('should return empty object for groups when no data present', async () => {
      const doc = await payload.create<GroupField>({
        collection: groupFieldsSlug,
        data: groupDoc,
      });

      expect(doc.potentiallyEmptyGroup).toEqual({});
    });
  });
});
