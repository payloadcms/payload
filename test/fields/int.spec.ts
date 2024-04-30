import type { IndexDirection, IndexOptions } from 'mongoose'

import { GraphQLClient } from 'graphql-request'

import type { MongooseAdapter } from '../../packages/db-mongodb/src/index'
import type { SanitizedConfig } from '../../packages/payload/src/config/types'
import type { PaginatedDocs } from '../../packages/payload/src/database/types'
import type { GroupField, RichTextField } from './payload-types'

import payload from '../../packages/payload/src'
import { devUser } from '../credentials'
import { initPayloadTest } from '../helpers/configHelpers'
import { isMongoose } from '../helpers/isMongoose'
import { RESTClient } from '../helpers/rest'
import configPromise from '../uploads/config'
import { arrayAfterChangeMock, arrayDefaultValue } from './collections/Array'
import { blocksDoc } from './collections/Blocks/shared'
import { dateDoc } from './collections/Date/shared'
import { groupAfterChangeMock, groupDefaultChild, groupDefaultValue } from './collections/Group'
import { groupDoc } from './collections/Group/shared'
import { defaultNumber } from './collections/Number'
import { numberDoc } from './collections/Number/shared'
import { pointDoc } from './collections/Point/shared'
import { rowAfterChangeMock } from './collections/Row'
import { tabAfterChangeMock } from './collections/Tabs'
import {
  localizedTextValue,
  namedTabDefaultValue,
  namedTabText,
} from './collections/Tabs/constants'
import { tabsDoc } from './collections/Tabs/shared'
import { defaultText } from './collections/Text/shared'
import { clearAndSeedEverything } from './seed'
import {
  arrayFieldsSlug,
  blockFieldsSlug,
  groupFieldsSlug,
  relationshipFieldsSlug,
  rowFieldsSlug,
  tabsFieldsSlug,
  textFieldsSlug,
} from './slugs'

let client: RESTClient
let graphQLClient: GraphQLClient
let serverURL: string
let config: SanitizedConfig
let token: string
let user: any

describe('Fields', () => {
  beforeAll(async () => {
    ;({ serverURL } = await initPayloadTest({ __dirname, init: { local: false } }))
    config = await configPromise

    client = new RESTClient(config, { defaultSlug: 'point-fields', serverURL })
    const graphQLURL = `${serverURL}${config.routes.api}${config.routes.graphQL}`
    graphQLClient = new GraphQLClient(graphQLURL)
    token = await client.login()

    user = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  })

  beforeEach(async () => {
    await clearAndSeedEverything(payload)
    client = new RESTClient(config, { defaultSlug: 'point-fields', serverURL })
    await client.login()
  })

  describe('text', () => {
    let doc
    const text = 'text field'
    beforeEach(async () => {
      doc = await payload.create({
        collection: 'text-fields',
        data: { text },
      })
    })

    it('creates with default values', () => {
      expect(doc.text).toEqual(text)
      expect(doc.defaultFunction).toEqual(defaultText)
      expect(doc.defaultAsync).toEqual(defaultText)
    })

    it('should populate default values in beforeValidate hook', async () => {
      const { dependentOnFieldWithDefaultValue, fieldWithDefaultValue } = await payload.create({
        collection: 'text-fields',
        data: { text },
      })

      await expect(fieldWithDefaultValue).toEqual(dependentOnFieldWithDefaultValue)
    })

    it('should localize an array of strings using hasMany', async () => {
      const localizedHasMany = ['hello', 'world']
      const { id } = await payload.create({
        collection: 'text-fields',
        data: {
          localizedHasMany,
          text,
        },
        locale: 'en',
      })
      const localizedDoc = await payload.findByID({
        id,
        collection: 'text-fields',
        locale: 'all',
      })

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(localizedDoc.localizedHasMany.en).toEqual(localizedHasMany)
    })

    it('should query hasMany in', async () => {
      const hit = await payload.create({
        collection: 'text-fields',
        data: {
          text: 'required',
          hasMany: ['one', 'five'],
        },
      })

      const miss = await payload.create({
        collection: 'text-fields',
        data: {
          text: 'required',
          hasMany: ['two'],
        },
      })

      const { docs } = await payload.find({
        collection: 'text-fields',
        where: {
          hasMany: {
            in: ['one'],
          },
        },
      })

      const hitResult = docs.find(({ id: findID }) => hit.id === findID)
      const missResult = docs.find(({ id: findID }) => miss.id === findID)

      expect(hitResult).toBeDefined()
      expect(missResult).toBeFalsy()
    })
  })

  describe('relationship', () => {
    let textDoc
    let otherTextDoc
    let selfReferencing
    let parent
    let child
    let grandChild
    let relationshipInArray
    const textDocText = 'text document'
    const otherTextDocText = 'alt text'
    const relationshipText = 'relationship text'

    beforeEach(async () => {
      textDoc = await payload.create({
        collection: 'text-fields',
        data: {
          text: textDocText,
        },
      })
      otherTextDoc = await payload.create({
        collection: 'text-fields',
        data: {
          text: otherTextDocText,
        },
      })
      const relationship = { relationTo: 'text-fields', value: textDoc.id }
      parent = await payload.create({
        collection: relationshipFieldsSlug,
        data: {
          relationship,
          text: relationshipText,
        },
      })

      child = await payload.create({
        collection: relationshipFieldsSlug,
        data: {
          relationToSelf: parent.id,
          relationship,
          text: relationshipText,
        },
      })

      grandChild = await payload.create({
        collection: relationshipFieldsSlug,
        data: {
          relationToSelf: child.id,
          relationship,
          text: relationshipText,
        },
      })

      selfReferencing = await payload.create({
        collection: relationshipFieldsSlug,
        data: {
          relationship,
          text: relationshipText,
        },
      })

      relationshipInArray = await payload.create({
        collection: relationshipFieldsSlug,
        data: {
          array: [
            {
              relationship: otherTextDoc.id,
            },
          ],
          relationship,
        },
      })
    })

    it('should query parent self-reference', async () => {
      const childResult = await payload.find({
        collection: relationshipFieldsSlug,
        where: {
          relationToSelf: { equals: parent.id },
        },
      })

      const grandChildResult = await payload.find({
        collection: relationshipFieldsSlug,
        where: {
          relationToSelf: { equals: child.id },
        },
      })

      const anyChildren = await payload.find({
        collection: relationshipFieldsSlug,
      })
      const allChildren = await payload.find({
        collection: relationshipFieldsSlug,
        where: {
          'relationToSelf.text': { equals: relationshipText },
        },
      })

      expect(childResult.docs[0].id).toStrictEqual(child.id)
      expect(grandChildResult.docs[0].id).toStrictEqual(grandChild.id)
      expect(allChildren.docs).toHaveLength(2)
    })

    it('should query relationship inside array', async () => {
      const result = await payload.find({
        collection: relationshipFieldsSlug,
        where: {
          'array.relationship.text': { equals: otherTextDocText },
        },
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0]).toMatchObject(relationshipInArray)
    })
  })

  describe('timestamps', () => {
    const tenMinutesAgo = new Date(Date.now() - 1000 * 60 * 10)
    let doc
    beforeEach(async () => {
      doc = await payload.create({
        collection: 'date-fields',
        data: dateDoc,
      })
    })

    it('should query updatedAt', async () => {
      const { docs } = await payload.find({
        collection: 'date-fields',
        depth: 0,
        where: {
          updatedAt: {
            greater_than_equal: tenMinutesAgo,
          },
        },
      })

      expect(docs.map(({ id }) => id)).toContain(doc.id)
    })

    it('should query createdAt', async () => {
      const result = await payload.find({
        collection: 'date-fields',
        depth: 0,
        where: {
          createdAt: {
            greater_than_equal: tenMinutesAgo,
          },
        },
      })

      expect(result.docs[0].id).toEqual(doc.id)
    })
  })

  describe('select', () => {
    let doc
    beforeEach(async () => {
      const { id } = await payload.create({
        collection: 'select-fields',
        data: {
          selectHasManyLocalized: ['one', 'two'],
        },
        locale: 'en',
      })
      doc = await payload.findByID({
        id,
        collection: 'select-fields',
        locale: 'all',
      })
    })

    it('creates with hasMany localized', () => {
      expect(doc.selectHasManyLocalized.en).toEqual(['one', 'two'])
    })

    it('retains hasMany updates', async () => {
      const { id } = await payload.create({
        collection: 'select-fields',
        data: {
          selectHasMany: ['one', 'two'],
        },
      })

      const updatedDoc = await payload.update({
        id,
        collection: 'select-fields',
        data: {
          select: 'one',
        },
      })

      expect(Array.isArray(updatedDoc.selectHasMany)).toBe(true)
      expect(updatedDoc.selectHasMany).toEqual(['one', 'two'])
    })

    it('should query hasMany in', async () => {
      const hit = await payload.create({
        collection: 'select-fields',
        data: {
          selectHasMany: ['one', 'four'],
        },
      })

      const miss = await payload.create({
        collection: 'select-fields',
        data: {
          selectHasMany: ['three'],
        },
      })

      const { docs } = await payload.find({
        collection: 'select-fields',
        where: {
          selectHasMany: {
            in: ['one'],
          },
        },
      })

      const hitResult = docs.find(({ id: findID }) => hit.id === findID)
      const missResult = docs.find(({ id: findID }) => miss.id === findID)

      expect(hitResult).toBeDefined()
      expect(missResult).toBeFalsy()
    })
  })

  describe('number', () => {
    let doc
    beforeEach(async () => {
      doc = await payload.create({
        collection: 'number-fields',
        data: numberDoc,
      })
    })

    it('creates with default values', async () => {
      expect(doc.number).toEqual(numberDoc.number)
      expect(doc.min).toEqual(numberDoc.min)
      expect(doc.max).toEqual(numberDoc.max)
      expect(doc.positiveNumber).toEqual(numberDoc.positiveNumber)
      expect(doc.negativeNumber).toEqual(numberDoc.negativeNumber)
      expect(doc.decimalMin).toEqual(numberDoc.decimalMin)
      expect(doc.decimalMax).toEqual(numberDoc.decimalMax)
      expect(doc.defaultNumber).toEqual(defaultNumber)
    })

    it('should not create number below minimum', async () => {
      await expect(async () =>
        payload.create({
          collection: 'number-fields',
          data: {
            min: 5,
          },
        }),
      ).rejects.toThrow('The following field is invalid: min')
    })
    it('should not create number above max', async () => {
      await expect(async () =>
        payload.create({
          collection: 'number-fields',
          data: {
            max: 15,
          },
        }),
      ).rejects.toThrow('The following field is invalid: max')
    })

    it('should not create number below 0', async () => {
      await expect(async () =>
        payload.create({
          collection: 'number-fields',
          data: {
            positiveNumber: -5,
          },
        }),
      ).rejects.toThrow('The following field is invalid: positiveNumber')
    })

    it('should not create number above 0', async () => {
      await expect(async () =>
        payload.create({
          collection: 'number-fields',
          data: {
            negativeNumber: 5,
          },
        }),
      ).rejects.toThrow('The following field is invalid: negativeNumber')
    })
    it('should not create a decimal number below min', async () => {
      await expect(async () =>
        payload.create({
          collection: 'number-fields',
          data: {
            decimalMin: -0.25,
          },
        }),
      ).rejects.toThrow('The following field is invalid: decimalMin')
    })

    it('should not create a decimal number above max', async () => {
      await expect(async () =>
        payload.create({
          collection: 'number-fields',
          data: {
            decimalMax: 1.5,
          },
        }),
      ).rejects.toThrow('The following field is invalid: decimalMax')
    })
    it('should localize an array of numbers using hasMany', async () => {
      const localizedHasMany = [5, 10]
      const { id } = await payload.create({
        collection: 'number-fields',
        data: {
          localizedHasMany,
        },
        locale: 'en',
      })
      const localizedDoc = await payload.findByID({
        id,
        collection: 'number-fields',
        locale: 'all',
      })

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(localizedDoc.localizedHasMany.en).toEqual(localizedHasMany)
    })

    it('should query hasMany in', async () => {
      const hit = await payload.create({
        collection: 'number-fields',
        data: {
          hasMany: [5, 10],
        },
      })

      const miss = await payload.create({
        collection: 'number-fields',
        data: {
          hasMany: [13],
        },
      })

      const { docs } = await payload.find({
        collection: 'number-fields',
        where: {
          hasMany: {
            in: [5],
          },
        },
      })

      const hitResult = docs.find(({ id: findID }) => hit.id === findID)
      const missResult = docs.find(({ id: findID }) => miss.id === findID)

      expect(hitResult).toBeDefined()
      expect(missResult).toBeFalsy()
    })
  })

  if (isMongoose(payload)) {
    describe('indexes', () => {
      let indexes
      const definitions: Record<string, IndexDirection> = {}
      const options: Record<string, IndexOptions> = {}

      beforeAll(() => {
        indexes = (payload.db as MongooseAdapter).collections[
          'indexed-fields'
        ].schema.indexes() as [Record<string, IndexDirection>, IndexOptions]

        indexes.forEach((index) => {
          const field = Object.keys(index[0])[0]
          definitions[field] = index[0][field]
          // eslint-disable-next-line prefer-destructuring
          options[field] = index[1]
        })
      })

      it('should have indexes', () => {
        expect(definitions.text).toEqual(1)
      })

      it('should have unique sparse indexes when field is not required', () => {
        expect(definitions.uniqueText).toEqual(1)
        expect(options.uniqueText).toMatchObject({ sparse: true, unique: true })
      })

      it('should have unique indexes that are not sparse when field is required', () => {
        expect(definitions.uniqueRequiredText).toEqual(1)
        expect(options.uniqueText).toMatchObject({ unique: true })
      })

      it('should have 2dsphere indexes on point fields', () => {
        expect(definitions.point).toEqual('2dsphere')
      })

      it('should have 2dsphere indexes on point fields in groups', () => {
        expect(definitions['group.point']).toEqual('2dsphere')
      })

      it('should have a sparse index on a unique localized field in a group', () => {
        expect(definitions['group.localizedUnique.en']).toEqual(1)
        expect(options['group.localizedUnique.en']).toMatchObject({ sparse: true, unique: true })
        expect(definitions['group.localizedUnique.es']).toEqual(1)
        expect(options['group.localizedUnique.es']).toMatchObject({ sparse: true, unique: true })
      })

      it('should have unique indexes in a collapsible', () => {
        expect(definitions['collapsibleLocalizedUnique.en']).toEqual(1)
        expect(options['collapsibleLocalizedUnique.en']).toMatchObject({
          sparse: true,
          unique: true,
        })
        expect(definitions.collapsibleTextUnique).toEqual(1)
        expect(options.collapsibleTextUnique).toMatchObject({ unique: true })
      })
    })

    describe('version indexes', () => {
      let indexes
      const definitions: Record<string, IndexDirection> = {}
      const options: Record<string, IndexOptions> = {}

      beforeEach(() => {
        indexes = (payload.db as MongooseAdapter).versions['indexed-fields'].schema.indexes() as [
          Record<string, IndexDirection>,
          IndexOptions,
        ]
        indexes.forEach((index) => {
          const field = Object.keys(index[0])[0]
          definitions[field] = index[0][field]
          // eslint-disable-next-line prefer-destructuring
          options[field] = index[1]
        })
      })

      it('should have versions indexes', () => {
        expect(definitions['version.text']).toEqual(1)
      })
    })

    describe('point', () => {
      let doc
      const point = [7, -7]
      const localized = [5, -2]
      const group = { point: [1, 9] }

      beforeEach(async () => {
        const findDoc = await payload.find({
          collection: 'point-fields',
          pagination: false,
        })
        ;[doc] = findDoc.docs
      })

      it('should read', async () => {
        const find = await payload.find({
          collection: 'point-fields',
          pagination: false,
        })

        ;[doc] = find.docs

        expect(doc.point).toEqual(pointDoc.point)
        expect(doc.localized).toEqual(pointDoc.localized)
        expect(doc.group).toMatchObject(pointDoc.group)
      })

      it('should create', async () => {
        doc = await payload.create({
          collection: 'point-fields',
          data: {
            group,
            localized,
            point,
          },
        })

        expect(doc.point).toEqual(point)
        expect(doc.localized).toEqual(localized)
        expect(doc.group).toMatchObject(group)
      })

      it('should not create duplicate point when unique', async () => {
        // first create the point field
        doc = await payload.create({
          collection: 'point-fields',
          data: {
            group,
            localized,
            point,
          },
        })

        // Now make sure we can't create a duplicate (since 'localized' is a unique field)
        await expect(() =>
          payload.create({
            collection: 'point-fields',
            data: {
              group,
              localized,
              point,
            },
          }),
        ).rejects.toThrow(Error)

        await expect(async () =>
          payload.create({
            collection: 'number-fields',
            data: {
              min: 5,
            },
          }),
        ).rejects.toThrow('The following field is invalid: min')

        expect(doc.point).toEqual(point)
        expect(doc.localized).toEqual(localized)
        expect(doc.group).toMatchObject(group)
      })
    })
  }

  describe('unique indexes', () => {
    it('should throw validation error saving on unique fields', async () => {
      const data = {
        text: 'a',
        uniqueText: 'a',
      }
      await payload.create({
        collection: 'indexed-fields',
        data,
      })
      expect(async () => {
        const result = await payload.create({
          collection: 'indexed-fields',
          data,
        })
        return result.error
      }).toBeDefined()
    })

    it('should not throw validation error saving multiple null values for unique fields', async () => {
      const data = {
        text: 'a',
        uniqueRequiredText: 'a',
        // uniqueText omitted on purpose
      }
      await payload.create({
        collection: 'indexed-fields',
        data,
      })
      data.uniqueRequiredText = 'b'
      const result = await payload.create({
        collection: 'indexed-fields',
        data,
      })

      expect(result.id).toBeDefined()
    })
  })

  describe('array', () => {
    let doc
    const collection = arrayFieldsSlug

    beforeEach(async () => {
      doc = await payload.create({
        collection,
        data: {},
      })
    })

    it('should create with ids and nested ids', async () => {
      const docWithIDs = (await payload.create({
        collection: groupFieldsSlug,
        data: groupDoc,
      })) as Partial<GroupField>
      expect(docWithIDs.group.subGroup.arrayWithinGroup[0].id).toBeDefined()
    })

    it('should create with defaultValue', async () => {
      expect(doc.items).toMatchObject(arrayDefaultValue)
      expect(doc.localized).toMatchObject(arrayDefaultValue)
    })

    it('should create and update localized subfields with versions', async () => {
      const doc = await payload.create({
        collection,
        data: {
          items: [
            {
              localizedText: 'test',
              text: 'required',
            },
          ],
          localized: [
            {
              text: 'english',
            },
          ],
        },
      })

      const spanish = await payload.update({
        id: doc.id,
        collection,
        data: {
          items: [
            {
              id: doc.items[0].id,
              localizedText: 'spanish',
              text: 'required',
            },
          ],
        },
        locale: 'es',
      })

      const result = await payload.findByID({
        id: doc.id,
        collection,
        locale: 'all',
      })

      expect(doc.items[0].localizedText).toStrictEqual('test')
      expect(spanish.items[0].localizedText).toStrictEqual('spanish')
      expect(result.items[0].localizedText.en).toStrictEqual('test')
      expect(result.items[0].localizedText.es).toStrictEqual('spanish')
    })

    it('should create with nested array', async () => {
      const subArrayText = 'something expected'
      const doc = await payload.create({
        collection,
        data: {
          items: [
            {
              subArray: [
                {
                  text: subArrayText,
                },
              ],
              text: 'test',
            },
          ],
        },
      })

      const result = await payload.findByID({
        id: doc.id,
        collection,
      })

      expect(result.items[0]).toMatchObject({
        subArray: [
          {
            text: subArrayText,
          },
        ],
        text: 'test',
      })
      expect(result.items[0].subArray[0].text).toStrictEqual(subArrayText)
    })

    it('should update without overwriting other locales with defaultValue', async () => {
      const localized = [{ text: 'unique' }]
      const enText = 'english'
      const esText = 'spanish'
      const { id } = await payload.create({
        collection,
        data: {
          localized,
        },
      })

      const enDoc = await payload.update({
        id,
        collection,
        data: {
          localized: [{ text: enText }],
        },
        locale: 'en',
      })

      const esDoc = await payload.update({
        id,
        collection,
        data: {
          localized: [{ text: esText }],
        },
        locale: 'es',
      })

      const allLocales = (await payload.findByID({
        id,
        collection,
        locale: 'all',
      })) as unknown as {
        localized: {
          en: unknown
          es: unknown
        }
      }

      expect(enDoc.localized[0].text).toStrictEqual(enText)
      expect(esDoc.localized[0].text).toStrictEqual(esText)
      expect(allLocales.localized.en[0].text).toStrictEqual(enText)
      expect(allLocales.localized.es[0].text).toStrictEqual(esText)
    })

    it('should call afterChange hook with correct value and previousValue', async () => {
      arrayAfterChangeMock.mockReset()

      doc = await payload.update({
        id: doc.id,
        collection: arrayFieldsSlug,
        data: {
          arrayWithNestedAfterChange: [
            {
              text: 'newNestedValue',
            },
            {
              id: doc.arrayWithNestedAfterChange[0].id,
              text: 'changedNestedValue',
            },
          ],
        },
      })

      expect(arrayAfterChangeMock).toHaveBeenCalledTimes(2)
      expect(arrayAfterChangeMock).toHaveBeenCalledWith({
        previousValue: undefined,
        value: 'newNestedValue',
      })
      expect(arrayAfterChangeMock).toHaveBeenCalledWith({
        previousValue: 'defaultNestedValue',
        value: 'changedNestedValue',
      })
    })
  })

  describe('group', () => {
    let document

    beforeEach(async () => {
      document = await payload.create({
        collection: groupFieldsSlug,
        data: {},
      })
    })

    it('should create with defaultValue', async () => {
      expect(document.group.defaultParent).toStrictEqual(groupDefaultValue)
      expect(document.group.defaultChild).toStrictEqual(groupDefaultChild)
    })

    it('should call afterChange hook with correct value and previousValue', async () => {
      document = await payload.update({
        id: document.id,
        collection: groupFieldsSlug,
        data: {
          groupWithNestedAfterChange: {
            text: 'changedNestedValue',
          },
        },
      })

      expect(groupAfterChangeMock).toHaveBeenLastCalledWith({
        previousValue: 'defaultNestedValue',
        value: 'changedNestedValue',
      })
    })
  })

  describe('row', () => {
    let document

    beforeEach(async () => {
      document = await payload.create({
        collection: rowFieldsSlug,
        data: {
          id: 'id',
          title: 'title',
        },
      })
    })

    it('should call afterChange hook with correct value and previousValue', async () => {
      document = await payload.update({
        id: document.id,
        collection: rowFieldsSlug,
        data: {
          nestedText: 'changedNestedValue',
        },
      })

      expect(rowAfterChangeMock).toHaveBeenLastCalledWith({
        previousValue: 'defaultNestedValue',
        value: 'changedNestedValue',
      })
    })

    it('should not have duplicate keys', async () => {
      const documentDefaults = await payload.create({
        collection: groupFieldsSlug,
        data: {},
      })
      expect(documentDefaults.arrayOfGroups[0]).toMatchObject({
        id: expect.any(String),
        groupItem: {
          text: 'Hello world',
        },
      })
    })
  })

  describe('tabs', () => {
    let document

    beforeEach(async () => {
      document = await payload.create({
        collection: tabsFieldsSlug,
        data: tabsDoc,
      })
    })

    it('should create with fields inside a named tab', async () => {
      expect(document.tab.text).toStrictEqual(namedTabText)
    })

    it('should create with defaultValue inside a named tab', async () => {
      expect(document.tab.defaultValue).toStrictEqual(namedTabDefaultValue)
    })

    it('should create with defaultValue inside a named tab with no other values', async () => {
      expect(document.namedTabWithDefaultValue.defaultValue).toStrictEqual(namedTabDefaultValue)
    })

    it('should create with localized text inside a named tab', async () => {
      document = await payload.findByID({
        id: document.id,
        collection: tabsFieldsSlug,
        locale: 'all',
      })
      expect(document.localizedTab.en.text).toStrictEqual(localizedTextValue)
    })

    it('should allow access control on a named tab', async () => {
      document = await payload.findByID({
        id: document.id,
        collection: tabsFieldsSlug,
        overrideAccess: false,
      })
      expect(document.accessControlTab).toBeUndefined()
    })

    it('should allow hooks on a named tab', async () => {
      const newDocument = await payload.create({
        collection: tabsFieldsSlug,
        data: tabsDoc,
      })
      expect(newDocument.hooksTab.beforeValidate).toBe(true)
      expect(newDocument.hooksTab.beforeChange).toBe(true)
      expect(newDocument.hooksTab.afterChange).toBe(true)
      expect(newDocument.hooksTab.afterRead).toBe(true)
    })

    it('should return empty object for groups when no data present', async () => {
      const doc = await payload.create({
        collection: groupFieldsSlug,
        data: groupDoc,
      })

      expect(doc.potentiallyEmptyGroup).toBeDefined()
    })

    it('should call afterChange hook with correct value and previousValue', async () => {
      document = await payload.update({
        id: document.id,
        collection: tabsFieldsSlug,
        data: {
          tabWithNestedAfterChange: {
            text: 'changedNestedValue',
          },
        },
      })

      expect(tabAfterChangeMock).toHaveBeenLastCalledWith({
        previousValue: 'initialNestedValue',
        value: 'changedNestedValue',
      })
    })
  })

  describe('blocks', () => {
    it('should retrieve doc with blocks', async () => {
      const blockFields = await payload.find({
        collection: 'block-fields',
      })

      expect(blockFields.docs[0].blocks[0].blockType).toEqual(blocksDoc.blocks[0].blockType)
      expect(blockFields.docs[0].blocks[0].text).toEqual(blocksDoc.blocks[0].text)

      expect(blockFields.docs[0].blocks[2].blockType).toEqual(blocksDoc.blocks[2].blockType)
      expect(blockFields.docs[0].blocks[2].blockName).toEqual(blocksDoc.blocks[2].blockName)
      expect(blockFields.docs[0].blocks[2].subBlocks[0].number).toEqual(
        blocksDoc.blocks[2].subBlocks[0].number,
      )
      expect(blockFields.docs[0].blocks[2].subBlocks[1].text).toEqual(
        blocksDoc.blocks[2].subBlocks[1].text,
      )
    })

    it('should query based on richtext data within a block', async () => {
      const blockFieldsSuccess = await payload.find({
        collection: 'block-fields',
        where: {
          'blocks.richText.children.text': {
            like: 'fun',
          },
        },
      })

      expect(blockFieldsSuccess.docs).toHaveLength(1)

      const blockFieldsFail = await payload.find({
        collection: 'block-fields',
        where: {
          'blocks.richText.children.text': {
            like: 'funny',
          },
        },
      })

      expect(blockFieldsFail.docs).toHaveLength(0)
    })

    it('should query based on richtext data within a localized block, specifying locale', async () => {
      const blockFieldsSuccess = await payload.find({
        collection: 'block-fields',
        where: {
          'localizedBlocks.en.richText.children.text': {
            like: 'fun',
          },
        },
      })

      expect(blockFieldsSuccess.docs).toHaveLength(1)

      const blockFieldsFail = await payload.find({
        collection: 'block-fields',
        where: {
          'localizedBlocks.en.richText.children.text': {
            like: 'funny',
          },
        },
      })

      expect(blockFieldsFail.docs).toHaveLength(0)
    })

    it('should query based on richtext data within a localized block, without specifying locale', async () => {
      const blockFieldsSuccess = await payload.find({
        collection: 'block-fields',
        where: {
          'localizedBlocks.richText.children.text': {
            like: 'fun',
          },
        },
      })

      expect(blockFieldsSuccess.docs).toHaveLength(1)

      const blockFieldsFail = await payload.find({
        collection: 'block-fields',
        where: {
          'localizedBlocks.richText.children.text': {
            like: 'funny',
          },
        },
      })

      expect(blockFieldsFail.docs).toHaveLength(0)
    })

    it('should create when existing block ids are used', async () => {
      const blockFields = await payload.find({
        collection: 'block-fields',
        limit: 1,
      })
      const [doc] = blockFields.docs

      const result = await payload.create({
        collection: 'block-fields',
        data: {
          ...doc,
        },
      })

      expect(result.id).toBeDefined()
    })

    it('should filter based on nested block fields', async () => {
      await payload.create({
        collection: 'block-fields',
        data: {
          blocks: [
            {
              blockType: 'content',
              text: 'green',
            },
          ],
        },
      })
      await payload.create({
        collection: 'block-fields',
        data: {
          blocks: [
            {
              blockType: 'content',
              text: 'pink',
            },
          ],
        },
      })
      await payload.create({
        collection: 'block-fields',
        data: {
          blocks: [
            {
              blockType: 'content',
              text: 'green',
            },
          ],
        },
      })

      const blockFields = await payload.find({
        collection: 'block-fields',
        overrideAccess: false,
        user,
        where: {
          and: [
            {
              'blocks.text': {
                equals: 'green',
              },
            },
          ],
        },
      })

      const { docs } = blockFields
      expect(docs).toHaveLength(2)
    })

    it('should query blocks with nested relationship', async () => {
      const textDoc = await payload.create({
        collection: textFieldsSlug,
        data: {
          text: 'test',
        },
      })
      const blockDoc = await payload.create({
        collection: blockFieldsSlug,
        data: {
          relationshipBlocks: [
            {
              blockType: 'relationships',
              relationship: textDoc.id,
            },
          ],
        },
      })
      const result = await payload.find({
        collection: blockFieldsSlug,
        where: {
          'relationshipBlocks.relationship': { equals: textDoc.id },
        },
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0]).toMatchObject(blockDoc)
    })

    it('should query by blockType', async () => {
      const text = 'blockType query test'

      const hit = await payload.create({
        collection: blockFieldsSlug,
        data: {
          blocks: [
            {
              blockType: 'content',
              text,
            },
          ],
        },
      })
      const miss = await payload.create({
        collection: blockFieldsSlug,
        data: {
          blocks: [
            {
              blockType: 'number',
              number: 5,
            },
          ],
          duplicate: [
            {
              blockType: 'content',
              text,
            },
          ],
        },
      })

      const { docs: equalsDocs } = await payload.find({
        collection: blockFieldsSlug,
        where: {
          and: [
            {
              'blocks.blockType': { equals: 'content' },
            },
            {
              'blocks.text': { equals: text },
            },
          ],
        },
      })

      const { docs: inDocs } = await payload.find({
        collection: blockFieldsSlug,
        where: {
          'blocks.blockType': { in: ['content'] },
        },
      })

      const equalsHitResult = equalsDocs.find(({ id }) => id === hit.id)
      const inHitResult = inDocs.find(({ id }) => id === hit.id)
      const equalsMissResult = equalsDocs.find(({ id }) => id === miss.id)
      const inMissResult = inDocs.find(({ id }) => id === miss.id)

      expect(equalsHitResult.id).toStrictEqual(hit.id)
      expect(inHitResult.id).toStrictEqual(hit.id)
      expect(equalsMissResult).toBeUndefined()
      expect(inMissResult).toBeUndefined()
    })
  })

  describe('json', () => {
    it('should save json data', async () => {
      const json = { foo: 'bar' }
      const doc = await payload.create({
        collection: 'json-fields',
        data: {
          json,
        },
      })

      expect(doc.json).toStrictEqual({ foo: 'bar' })
    })

    it('should validate json', async () => {
      await expect(async () =>
        payload.create({
          collection: 'json-fields',
          data: {
            json: '{ bad input: true }',
          },
        }),
      ).rejects.toThrow('The following field is invalid: json')
    })

    it('should validate json schema', async () => {
      await expect(async () =>
        payload.create({
          collection: 'json-fields',
          data: {
            json: { foo: 'bad' },
          },
        }),
      ).rejects.toThrow('The following field is invalid: json')
    })

    it('should save empty json objects', async () => {
      const jsonFieldsDoc = await payload.create({
        collection: 'json-fields',
        data: {
          json: {
            state: {},
          },
        },
      })

      expect(jsonFieldsDoc.json.state).toEqual({})

      const updatedJsonFieldsDoc = await payload.update({
        id: jsonFieldsDoc.id,
        collection: 'json-fields',
        data: {
          json: {
            state: {},
          },
        },
      })

      expect(updatedJsonFieldsDoc.json.state).toEqual({})
    })

    describe('querying', () => {
      let fooBar
      let bazBar

      beforeEach(async () => {
        fooBar = await payload.create({
          collection: 'json-fields',
          data: {
            json: { foo: 'foobar', number: 5 },
          },
        })
        bazBar = await payload.create({
          collection: 'json-fields',
          data: {
            json: { baz: 'bar', number: 10 },
          },
        })
      })

      it('should query nested properties - like', async () => {
        const { docs } = await payload.find({
          collection: 'json-fields',
          where: {
            'json.foo': { like: 'bar' },
          },
        })

        const docIDs = docs.map(({ id }) => id)

        expect(docIDs).toContain(fooBar.id)
        expect(docIDs).not.toContain(bazBar.id)
      })

      it('should query nested properties - equals', async () => {
        const { docs } = await payload.find({
          collection: 'json-fields',
          where: {
            'json.foo': { equals: 'foobar' },
          },
        })

        const notEquals = await payload.find({
          collection: 'json-fields',
          where: {
            'json.foo': { equals: 'bar' },
          },
        })

        const docIDs = docs.map(({ id }) => id)

        expect(docIDs).toContain(fooBar.id)
        expect(docIDs).not.toContain(bazBar.id)
        expect(notEquals.docs).toHaveLength(0)
      })

      it('should query nested numbers - equals', async () => {
        const { docs } = await payload.find({
          collection: 'json-fields',
          where: {
            'json.number': { equals: 5 },
          },
        })

        const docIDs = docs.map(({ id }) => id)

        expect(docIDs).toContain(fooBar.id)
        expect(docIDs).not.toContain(bazBar.id)
      })

      it('should query nested properties - exists', async () => {
        const { docs } = await payload.find({
          collection: 'json-fields',
          where: {
            'json.foo': { exists: true },
          },
        })

        const docIDs = docs.map(({ id }) => id)

        expect(docIDs).toContain(fooBar.id)
        expect(docIDs).not.toContain(bazBar.id)
      })

      it('should query - exists', async () => {
        const nullJSON = await payload.create({
          collection: 'json-fields',
          data: {},
        })
        const hasJSON = await payload.create({
          collection: 'json-fields',
          data: {
            json: [],
          },
        })

        const docsExistsFalse = await payload.find({
          collection: 'json-fields',
          where: {
            json: { exists: false },
          },
        })
        const docsExistsTrue = await payload.find({
          collection: 'json-fields',
          where: {
            json: { exists: true },
          },
        })

        const existFalseIDs = docsExistsFalse.docs.map(({ id }) => id)
        const existTrueIDs = docsExistsTrue.docs.map(({ id }) => id)

        expect(existFalseIDs).toContain(nullJSON.id)
        expect(existTrueIDs).not.toContain(nullJSON.id)

        expect(existTrueIDs).toContain(hasJSON.id)
        expect(existFalseIDs).not.toContain(hasJSON.id)
      })

      it('exists should not return null values', async () => {
        const { id } = await payload.create({
          collection: 'select-fields',
          data: {
            select: 'one',
          },
        })

        const existsResult = await payload.find({
          collection: 'select-fields',
          where: {
            id: { equals: id },
            select: { exists: true },
          },
        })

        expect(existsResult.docs).toHaveLength(1)

        const existsFalseResult = await payload.find({
          collection: 'select-fields',
          where: {
            id: { equals: id },
            select: { exists: false },
          },
        })

        expect(existsFalseResult.docs).toHaveLength(0)

        await payload.update({
          id,
          collection: 'select-fields',
          data: {
            select: null,
          },
        })

        const existsTrueResult = await payload.find({
          collection: 'select-fields',
          where: {
            id: { equals: id },
            select: { exists: true },
          },
        })

        expect(existsTrueResult.docs).toHaveLength(0)

        const result = await payload.find({
          collection: 'select-fields',
          where: {
            id: { equals: id },
            select: { exists: false },
          },
        })

        expect(result.docs).toHaveLength(1)
      })
    })
  })

  describe('richText', () => {
    it('should allow querying on rich text content', async () => {
      const emptyRichTextQuery = await payload.find({
        collection: 'rich-text-fields',
        where: {
          'richText.children.text': {
            like: 'doesnt exist',
          },
        },
      })

      expect(emptyRichTextQuery.docs).toHaveLength(0)

      const workingRichTextQuery = await payload.find({
        collection: 'rich-text-fields',
        where: {
          'richText.children.text': {
            like: 'hello',
          },
        },
      })

      expect(workingRichTextQuery.docs).toHaveLength(1)
    })

    it('should show center alignment', async () => {
      const query = await payload.find({
        collection: 'rich-text-fields',
        where: {
          'richText.children.text': {
            like: 'hello',
          },
        },
      })

      expect(query.docs[0].richText[0].textAlign).toEqual('center')
    })

    it('should populate link relationship', async () => {
      const query = await payload.find({
        collection: 'rich-text-fields',
        where: {
          'richText.children.linkType': {
            equals: 'internal',
          },
        },
      })

      const nodes = query.docs[0].richText
      expect(nodes).toBeDefined()
      const child = nodes.flatMap((n) => n.children).find((c) => c.doc)
      expect(child).toMatchObject({
        type: 'link',
        linkType: 'internal',
      })
      expect(child.doc.relationTo).toEqual('array-fields')

      if (payload.db.defaultIDType === 'number') {
        expect(typeof child.doc.value.id).toBe('number')
      } else {
        expect(typeof child.doc.value.id).toBe('string')
      }

      expect(child.doc.value.items).toHaveLength(6)
    })

    it('should respect rich text depth parameter', async () => {
      const query = `query {
        RichTextFields {
          docs {
            richText(depth: 2)
          }
        }
      }`
      const response = await graphQLClient.request(
        query,
        {},
        {
          Authorization: `JWT ${token}`,
        },
      )
      const { docs }: PaginatedDocs<RichTextField> = response.RichTextFields
      const uploadElement = docs[0].richText.find((el) => el.type === 'upload') as any
      expect(uploadElement.value.media.filename).toStrictEqual('payload.png')
    })
  })

  describe('relationships', () => {
    it('should not crash if querying with empty in operator', async () => {
      const query = await payload.find({
        collection: 'relationship-fields',
        where: {
          'relationship.value': {
            in: [],
          },
        },
      })

      expect(query.docs).toBeDefined()
    })
  })

  describe('clearable fields - exists', () => {
    it('exists should not return null values', async () => {
      const { id } = await payload.create({
        collection: 'select-fields',
        data: {
          select: 'one',
        },
      })

      const existsResult = await payload.find({
        collection: 'select-fields',
        where: {
          id: { equals: id },
          select: { exists: true },
        },
      })

      expect(existsResult.docs).toHaveLength(1)

      const existsFalseResult = await payload.find({
        collection: 'select-fields',
        where: {
          id: { equals: id },
          select: { exists: false },
        },
      })

      expect(existsFalseResult.docs).toHaveLength(0)

      await payload.update({
        id,
        collection: 'select-fields',
        data: {
          select: null,
        },
      })

      const existsTrueResult = await payload.find({
        collection: 'select-fields',
        where: {
          id: { equals: id },
          select: { exists: true },
        },
      })

      expect(existsTrueResult.docs).toHaveLength(0)

      const result = await payload.find({
        collection: 'select-fields',
        where: {
          id: { equals: id },
          select: { exists: false },
        },
      })

      expect(result.docs).toHaveLength(1)
    })
  })
})
