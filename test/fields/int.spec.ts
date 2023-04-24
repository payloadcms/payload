import type { IndexDirection, IndexOptions } from 'mongoose';
import { initPayloadTest } from '../helpers/configHelpers';
import { RESTClient } from '../helpers/rest';
import configPromise from '../uploads/config';
import payload from '../../src';
import { pointDoc } from './collections/Point';
import { arrayFieldsSlug, arrayDefaultValue, arrayDoc } from './collections/Array';
import { groupFieldsSlug, groupDefaultChild, groupDefaultValue, groupDoc } from './collections/Group';
import { defaultText } from './collections/Text';
import { blocksFieldSeedData } from './collections/Blocks';
import { localizedTextValue, namedTabDefaultValue, namedTabText, tabsDoc, tabsSlug } from './collections/Tabs';
import { defaultNumber, numberDoc } from './collections/Number';

let client;
let serverURL;
let config;

describe('Fields', () => {
  beforeAll(async () => {
    ({ serverURL } = await initPayloadTest({ __dirname, init: { local: false } }));
    config = await configPromise;

    client = new RESTClient(config, { serverURL, defaultSlug: 'point-fields' });
    await client.login();
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

  describe('select', () => {
    let doc;
    beforeAll(async () => {
      const { id } = await payload.create({
        collection: 'select-fields',
        locale: 'en',
        data: {
          selectHasManyLocalized: ['one', 'two'],
        },
      });
      doc = await payload.findByID({
        collection: 'select-fields',
        locale: 'all',
        id,
      });
    });

    it('creates with hasMany localized', () => {
      expect(doc.selectHasManyLocalized.en).toEqual(['one', 'two']);
    });

    it('retains hasMany updates', async () => {
      const { id } = await payload.create({
        collection: 'select-fields',
        data: {
          selectHasMany: ['one', 'two'],
        },
      });

      const updatedDoc = await payload.update({
        collection: 'select-fields',
        id,
        data: {
          select: 'one',
        },
      });

      expect(Array.isArray(updatedDoc.selectHasMany)).toBe(true);
      expect(updatedDoc.selectHasMany).toEqual(['one', 'two']);
    });
  });

  describe('number', () => {
    let doc;
    beforeAll(async () => {
      doc = await payload.create({
        collection: 'number-fields',
        data: numberDoc,
      });
    });

    it('creates with default values', async () => {
      expect(doc.number).toEqual(numberDoc.number);
      expect(doc.min).toEqual(numberDoc.min);
      expect(doc.max).toEqual(numberDoc.max);
      expect(doc.positiveNumber).toEqual(numberDoc.positiveNumber);
      expect(doc.negativeNumber).toEqual(numberDoc.negativeNumber);
      expect(doc.decimalMin).toEqual(numberDoc.decimalMin);
      expect(doc.decimalMax).toEqual(numberDoc.decimalMax);
      expect(doc.defaultNumber).toEqual(defaultNumber);
    });

    it('should not create number below minimum', async () => {
      await expect(async () => payload.create({
        collection: 'number-fields',
        data: {
          min: 5,
        },
      })).rejects.toThrow('The following field is invalid: min');
    });
    it('should not create number above max', async () => {
      await expect(async () => payload.create({
        collection: 'number-fields',
        data: {
          max: 15,
        },
      })).rejects.toThrow('The following field is invalid: max');
    });

    it('should not create number below 0', async () => {
      await expect(async () => payload.create({
        collection: 'number-fields',
        data: {
          positiveNumber: -5,
        },
      })).rejects.toThrow('The following field is invalid: positiveNumber');
    });

    it('should not create number above 0', async () => {
      await expect(async () => payload.create({
        collection: 'number-fields',
        data: {
          negativeNumber: 5,
        },
      })).rejects.toThrow('The following field is invalid: negativeNumber');
    });
    it('should not create a decimal number below min', async () => {
      await expect(async () => payload.create({
        collection: 'number-fields',
        data: {
          decimalMin: -0.25,
        },
      })).rejects.toThrow('The following field is invalid: decimalMin');
    });

    it('should not create a decimal number above max', async () => {
      await expect(async () => payload.create({
        collection: 'number-fields',
        data: {
          decimalMax: 1.5,
        },
      })).rejects.toThrow('The following field is invalid: decimalMax');
    });
  });

  describe('indexes', () => {
    let indexes;
    const definitions: Record<string, IndexDirection> = {};
    const options: Record<string, IndexOptions> = {};

    beforeAll(() => {
      // mongoose model schema indexes do not always create indexes in the actual database
      // see: https://github.com/payloadcms/payload/issues/571

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
    it('should have unique indexes in a collapsible', () => {
      expect(definitions['collapsibleLocalizedUnique.en']).toEqual(1);
      expect(options['collapsibleLocalizedUnique.en']).toMatchObject({ unique: true, sparse: true });
      expect(definitions.collapsibleTextUnique).toEqual(1);
      expect(options.collapsibleTextUnique).toMatchObject({ unique: true });
    });

    it('should throw validation error saving on unique fields', async () => {
      const data = {
        text: 'a',
        uniqueText: 'a',
      };
      await payload.create({
        collection: 'indexed-fields',
        data,
      });
      expect(async () => {
        const result = await payload.create({
          collection: 'indexed-fields',
          data,
        });
        return result.error;
      }).toBeDefined();
    });
  });

  describe('point', () => {
    let doc;
    const point = [7, -7];
    const localized = [5, -2];
    const group = { point: [1, 9] };

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

    it('should not create duplicate point when unique', async () => {
      await expect(() => payload.create({
        collection: 'point-fields',
        data: {
          point,
          localized,
          group,
        },
      }))
        .rejects
        .toThrow(Error);

      await expect(async () => payload.create({
        collection: 'number-fields',
        data: {
          min: 5,
        },
      })).rejects.toThrow('The following field is invalid: min');

      expect(doc.point).toEqual(point);
      expect(doc.localized).toEqual(localized);
      expect(doc.group).toMatchObject(group);
    });
  });
  describe('array', () => {
    let doc;
    const collection = arrayFieldsSlug;

    beforeAll(async () => {
      doc = await payload.create({
        collection,
        data: {},
      });
    });

    it('should return undefined arrays when no data present', async () => {
      const document = await payload.create({
        collection: arrayFieldsSlug,
        data: arrayDoc,
      });

      expect(document.potentiallyEmptyArray).toBeUndefined();
    });

    it('should create with ids and nested ids', async () => {
      const docWithIDs = await payload.create({
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
      const { id } = await payload.create({
        collection,
        data: {
          localized,
        },
      });

      const enDoc = await payload.update({
        collection,
        id,
        locale: 'en',
        data: {
          localized: [{ text: enText }],
        },
      });

      const esDoc = await payload.update({
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
      }) as unknown as { localized: { en: unknown, es: unknown } };

      expect(enDoc.localized[0].text).toStrictEqual(enText);
      expect(esDoc.localized[0].text).toStrictEqual(esText);
      expect(allLocales.localized.en[0].text).toStrictEqual(enText);
      expect(allLocales.localized.es[0].text).toStrictEqual(esText);
    });
  });

  describe('group', () => {
    let document;

    beforeAll(async () => {
      document = await payload.create({
        collection: groupFieldsSlug,
        data: {},
      });
    });

    it('should create with defaultValue', async () => {
      expect(document.group.defaultParent).toStrictEqual(groupDefaultValue);
      expect(document.group.defaultChild).toStrictEqual(groupDefaultChild);
    });
  });

  describe('tabs', () => {
    let document;

    beforeAll(async () => {
      document = await payload.create({
        collection: tabsSlug,
        data: tabsDoc,
      });
    });

    it('should create with fields inside a named tab', async () => {
      expect(document.tab.text).toStrictEqual(namedTabText);
    });

    it('should create with defaultValue inside a named tab', async () => {
      expect(document.tab.defaultValue).toStrictEqual(namedTabDefaultValue);
    });

    it('should create with defaultValue inside a named tab with no other values', async () => {
      expect(document.namedTabWithDefaultValue.defaultValue).toStrictEqual(namedTabDefaultValue);
    });

    it('should create with localized text inside a named tab', async () => {
      document = await payload.findByID({
        collection: tabsSlug,
        id: document.id,
        locale: 'all',
      });
      expect(document.localizedTab.en.text).toStrictEqual(localizedTextValue);
    });

    it('should allow access control on a named tab', async () => {
      document = await payload.findByID({
        collection: tabsSlug,
        id: document.id,
        overrideAccess: false,
      });
      expect(document.accessControlTab).toBeUndefined();
    });

    it('should allow hooks on a named tab', async () => {
      const newDocument = await payload.create({
        collection: tabsSlug,
        data: tabsDoc,
      });
      expect(newDocument.hooksTab.beforeValidate).toBe(true);
      expect(newDocument.hooksTab.beforeChange).toBe(true);
      expect(newDocument.hooksTab.afterChange).toBe(true);
      expect(newDocument.hooksTab.afterRead).toBe(true);
    });

    it('should return empty object for groups when no data present', async () => {
      const doc = await payload.create({
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

    it('should query based on richtext data within a block', async () => {
      const blockFieldsSuccess = await payload.find({
        collection: 'block-fields',
        where: {
          'blocks.richText.children.text': {
            like: 'fun',
          },
        },
      });

      expect(blockFieldsSuccess.docs).toHaveLength(1);

      const blockFieldsFail = await payload.find({
        collection: 'block-fields',
        where: {
          'blocks.richText.children.text': {
            like: 'funny',
          },
        },
      });

      expect(blockFieldsFail.docs).toHaveLength(0);
    });

    it('should query based on richtext data within a localized block, specifying locale', async () => {
      const blockFieldsSuccess = await payload.find({
        collection: 'block-fields',
        where: {
          'localizedBlocks.en.richText.children.text': {
            like: 'fun',
          },
        },
      });

      expect(blockFieldsSuccess.docs).toHaveLength(1);

      const blockFieldsFail = await payload.find({
        collection: 'block-fields',
        where: {
          'localizedBlocks.en.richText.children.text': {
            like: 'funny',
          },
        },
      });

      expect(blockFieldsFail.docs).toHaveLength(0);
    });

    it('should query based on richtext data within a localized block, without specifying locale', async () => {
      const blockFieldsSuccess = await payload.find({
        collection: 'block-fields',
        where: {
          'localizedBlocks.richText.children.text': {
            like: 'fun',
          },
        },
      });

      expect(blockFieldsSuccess.docs).toHaveLength(1);

      const blockFieldsFail = await payload.find({
        collection: 'block-fields',
        where: {
          'localizedBlocks.richText.children.text': {
            like: 'funny',
          },
        },
      });

      expect(blockFieldsFail.docs).toHaveLength(0);
    });
  });

  describe('json', () => {
    it('should save json data', async () => {
      const json = { foo: 'bar' };
      const doc = await payload.create({
        collection: 'json-fields',
        data: {
          json,
        },
      });

      expect(doc.json).toStrictEqual({ foo: 'bar' });
    });

    it('should validate json', async () => {
      await expect(async () => payload.create({
        collection: 'json-fields',
        data: {
          json: '{ bad input: true }',
        },
      })).rejects.toThrow('The following field is invalid: json');
    });

    it('should save empty json objects', async () => {
      const jsonFieldsDoc = await payload.create({
        collection: 'json-fields',
        data: {
          json: {
            state: {},
          },
        },
      });

      expect(jsonFieldsDoc.json.state).toEqual({});

      const updatedJsonFieldsDoc = await payload.update({
        collection: 'json-fields',
        id: jsonFieldsDoc.id,
        data: {
          json: {
            state: {},
          },
        },
      });

      expect(updatedJsonFieldsDoc.json.state).toEqual({});
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

    it('should populate link relationship', async () => {
      const query = await payload.find({
        collection: 'rich-text-fields',
        where: {
          'richText.children.linkType': {
            equals: 'internal',
          },
        },
      });

      const nodes = query.docs[0].richText;
      expect(nodes).toBeDefined();
      const child = nodes.flatMap((n) => n.children)
        .find((c) => c.doc);
      expect(child).toMatchObject({
        type: 'link',
        linkType: 'internal',
      });
      expect(child.doc.relationTo).toEqual('array-fields');
      expect(typeof child.doc.value.id).toBe('string');
      expect(child.doc.value.items).toHaveLength(6);
    });
  });
});
