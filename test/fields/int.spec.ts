import type { IndexDirection, IndexOptions } from 'mongoose';
import { initPayloadTest } from '../helpers/configHelpers';
import { RESTClient } from '../helpers/rest';
import config from '../uploads/config';
import payload from '../../src';
import { pointDoc } from './collections/Point';
import type { ArrayField, BlockField, GroupField } from './payload-types';
import { arrayFieldsSlug, arrayDefaultValue, arrayDoc } from './collections/Array';
import { groupFieldsSlug, groupDefaultChild, groupDefaultValue, groupDoc } from './collections/Group';
import { defaultText } from './collections/Text';
import { blocksFieldSeedData } from './collections/Blocks';

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
    const definitions: Record<string, IndexDirection> = {};
    const options: Record<string, IndexOptions> = {};

    beforeAll(() => {
      indexes = payload.collections['indexed-fields'].Model.schema.indexes() as [Record<string, IndexDirection>, IndexOptions];

      indexes.forEach((index) => {
        const field = Object.keys(index[0])[0];
        definitions[field] = index[0][field];
        // eslint-disable-next-line prefer-destructuring
        options[field] = index[1];
      });
    });

    it('should have indexes', () => {
      expect(definitions.text).toEqual(1);
    });
    it('should have unique indexes', () => {
      expect(definitions.uniqueText).toEqual(1);
      expect(options.uniqueText).toMatchObject({ unique: true });
    });
    it('should have 2dsphere indexes on point fields', () => {
      expect(definitions.point).toEqual('2dsphere');
    });
    it('should have 2dsphere indexes on point fields in groups', () => {
      expect(definitions['group.point']).toEqual('2dsphere');
    });
    it('should have a sparse index on a unique localized field in a group', () => {
      expect(definitions['group.localizedUnique.en']).toEqual(1);
      expect(options['group.localizedUnique.en']).toMatchObject({ unique: true, sparse: true });
      expect(definitions['group.localizedUnique.es']).toEqual(1);
      expect(options['group.localizedUnique.es']).toMatchObject({ unique: true, sparse: true });
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

  describe('blocks', () => {
    it('should retrieve doc with blocks', async () => {
      const blockFields = await payload.find({
        collection: 'block-fields',
      });

      expect(blockFields.docs[0].blocks[0].blockType).toEqual(blocksFieldSeedData[0].blockType);
      expect(blockFields.docs[0].blocks[0].text).toEqual(blocksFieldSeedData[0].text);

      expect(blockFields.docs[0].blocks[2].blockType).toEqual(blocksFieldSeedData[2].blockType);
      expect(blockFields.docs[0].blocks[2].blockName).toEqual(blocksFieldSeedData[2].blockName);
      expect(blockFields.docs[0].blocks[2].subBlocks[0].number).toEqual(blocksFieldSeedData[2].subBlocks[0].number);
      expect(blockFields.docs[0].blocks[2].subBlocks[1].text).toEqual(blocksFieldSeedData[2].subBlocks[1].text);
    });
  });

  describe('richText', () => {
    it('should allow querying on rich text content', async () => {
      const emptyRichTextQuery = await payload.find({
        collection: 'rich-text-fields',
        where: {
          'richText.children.text': {
            like: 'doesnt exist',
          },
        },
      });

      expect(emptyRichTextQuery.docs).toHaveLength(0);

      const workingRichTextQuery = await payload.find({
        collection: 'rich-text-fields',
        where: {
          'richText.children.text': {
            like: 'hello',
          },
        },
      });

      expect(workingRichTextQuery.docs).toHaveLength(1);
    });
  });
});
