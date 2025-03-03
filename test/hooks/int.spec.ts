import type { Payload } from 'payload'

import path from 'path'
import { AuthenticationError } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser, regularUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { isMongoose } from '../helpers/isMongoose.js'
import { afterOperationSlug } from './collections/AfterOperation/index.js'
import { chainingHooksSlug } from './collections/ChainingHooks/index.js'
import { contextHooksSlug } from './collections/ContextHooks/index.js'
import { dataHooksSlug } from './collections/Data/index.js'
import { hooksSlug } from './collections/Hook/index.js'
import {
  generatedAfterReadText,
  nestedAfterReadHooksSlug,
} from './collections/NestedAfterReadHooks/index.js'
import { relationsSlug } from './collections/Relations/index.js'
import { transformSlug } from './collections/Transform/index.js'
import { hooksUsersSlug } from './collections/Users/index.js'
import { valueHooksSlug } from './collections/Value/index.js'
import { HooksConfig } from './config.js'
import { dataHooksGlobalSlug } from './globals/Data/index.js'
import { beforeValidateSlug, fieldPathsSlug } from './shared.js'

let restClient: NextRESTClient
let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Hooks', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })
  if (isMongoose(payload)) {
    describe('transform actions', () => {
      it('should create and not throw an error', async () => {
        // the collection has hooks that will cause an error if transform actions is not handled properly
        const doc = await payload.create({
          collection: transformSlug,
          data: {
            localizedTransform: [2, 8],
            transform: [2, 8],
          },
        })

        expect(doc.transform).toBeDefined()
        expect(doc.localizedTransform).toBeDefined()
      })
    })
  }

  describe('hook execution', () => {
    let doc
    const data = {
      collectionAfterChange: false,
      collectionAfterRead: false,
      collectionBeforeChange: false,
      collectionBeforeRead: false,
      collectionBeforeValidate: false,
      fieldAfterChange: false,
      fieldAfterRead: false,
      fieldBeforeChange: false,
      fieldBeforeValidate: false,
    }
    beforeEach(async () => {
      doc = await payload.create({
        collection: hooksSlug,
        data,
      })
    })

    it('should execute hooks in correct order on create', () => {
      expect(doc.collectionAfterChange).toBeTruthy()
      expect(doc.collectionAfterRead).toBeTruthy()
      expect(doc.collectionBeforeChange).toBeTruthy()
      // beforeRead is not run on create operation
      expect(doc.collectionBeforeRead).toBeFalsy()
      expect(doc.collectionBeforeValidate).toBeTruthy()
      expect(doc.fieldAfterChange).toBeTruthy()
      expect(doc.fieldAfterRead).toBeTruthy()
      expect(doc.fieldBeforeChange).toBeTruthy()
      expect(doc.fieldBeforeValidate).toBeTruthy()
    })

    it('should execute hooks in correct order on update', async () => {
      doc = await payload.update({
        id: doc.id,
        collection: hooksSlug,
        data,
      })

      expect(doc.collectionAfterChange).toBeTruthy()
      expect(doc.collectionAfterRead).toBeTruthy()
      expect(doc.collectionBeforeChange).toBeTruthy()
      // beforeRead is not run on update operation
      expect(doc.collectionBeforeRead).toBeFalsy()
      expect(doc.collectionBeforeValidate).toBeTruthy()
      expect(doc.fieldAfterChange).toBeTruthy()
      expect(doc.fieldAfterRead).toBeTruthy()
      expect(doc.fieldBeforeChange).toBeTruthy()
      expect(doc.fieldBeforeValidate).toBeTruthy()
    })

    it('should execute hooks in correct order on find', async () => {
      doc = await payload.findByID({
        id: doc.id,
        collection: hooksSlug,
      })

      expect(doc.collectionAfterRead).toBeTruthy()
      expect(doc.collectionBeforeRead).toBeTruthy()
      expect(doc.fieldAfterRead).toBeTruthy()
    })

    it('should save data generated with afterRead hooks in nested field structures', async () => {
      const document = await payload.create({
        collection: nestedAfterReadHooksSlug,
        data: {
          group: {
            array: [{ input: 'input' }],
          },
          text: 'ok',
        },
      })

      expect(document.group.subGroup.afterRead).toEqual(generatedAfterReadText)
      expect(document.group.array[0].afterRead).toEqual(generatedAfterReadText)
    })

    it('should populate related docs within nested field structures', async () => {
      const relation = await payload.create({
        collection: relationsSlug,
        data: {
          title: 'Hello',
        },
      })

      const document = await payload.create({
        collection: nestedAfterReadHooksSlug,
        data: {
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
          text: 'ok',
        },
      })

      const retrievedDoc = await payload.findByID({
        id: document.id,
        collection: nestedAfterReadHooksSlug,
      })

      expect(retrievedDoc.group.array[0].shouldPopulate.title).toEqual(relation.title)
      expect(retrievedDoc.group.subGroup.shouldPopulate.title).toEqual(relation.title)
    })

    it('should pass result from previous hook into next hook with findByID', async () => {
      const document = await payload.create({
        collection: chainingHooksSlug,
        data: {
          text: 'ok',
        },
      })

      const retrievedDoc = await payload.findByID({
        id: document.id,
        collection: chainingHooksSlug,
      })

      expect(retrievedDoc.text).toEqual('ok!!')
    })

    it('should pass result from previous hook into next hook with find', async () => {
      const document = await payload.create({
        collection: chainingHooksSlug,
        data: {
          text: 'ok',
        },
      })

      const { docs: retrievedDocs } = await payload.find({
        collection: chainingHooksSlug,
      })

      expect(retrievedDocs[0].text).toEqual('ok!!')
    })

    it('should execute collection afterOperation hook', async () => {
      const [doc1, doc2] = await Promise.all([
        await payload.create({
          collection: afterOperationSlug,
          data: {
            title: 'Title',
          },
        }),
        await payload.create({
          collection: afterOperationSlug,
          data: {
            title: 'Title',
          },
        }),
      ])

      expect(doc1.title === 'Title created').toBeTruthy()
      expect(doc2.title === 'Title created').toBeTruthy()

      const findResult = await payload.find({
        collection: afterOperationSlug,
      })

      expect(findResult.docs).toHaveLength(2)
      expect(findResult.docs[0].title === 'Title read').toBeTruthy()
      expect(findResult.docs[1].title === 'Title').toBeTruthy()

      const [updatedDoc1, updatedDoc2] = await Promise.all([
        await payload.update({
          id: doc1.id,
          collection: afterOperationSlug,
          data: {
            title: 'Title',
          },
        }),
        await payload.update({
          id: doc2.id,
          collection: afterOperationSlug,
          data: {
            title: 'Title',
          },
        }),
      ])

      expect(updatedDoc1.title === 'Title updated').toBeTruthy()
      expect(updatedDoc2.title === 'Title updated').toBeTruthy()

      const findResult2 = await payload.find({
        collection: afterOperationSlug,
      })

      expect(findResult2.docs).toHaveLength(2)
      expect(findResult2.docs[0].title === 'Title read').toBeTruthy()
      expect(findResult2.docs[1].title === 'Title').toBeTruthy()
    })

    it('should pass context from beforeChange to afterChange', async () => {
      const document = await payload.create({
        collection: contextHooksSlug,
        data: {
          value: 'wrongvalue',
        },
      })

      const retrievedDoc = await payload.findByID({
        id: document.id,
        collection: contextHooksSlug,
      })

      expect(retrievedDoc.value).toEqual('secret')
    })

    it('should pass context from local API to hooks', async () => {
      const document = await payload.create({
        collection: contextHooksSlug,
        context: {
          secretValue: 'data from local API',
        },
        data: {
          value: 'wrongvalue',
        },
      })

      const retrievedDoc = await payload.findByID({
        id: document.id,
        collection: contextHooksSlug,
      })

      expect(retrievedDoc.value).toEqual('data from local API')
    })

    it('should pass context from local API to global hooks', async () => {
      const globalDocument = await payload.findGlobal({
        slug: dataHooksGlobalSlug,
      })

      expect(globalDocument.field_globalAndField).not.toEqual('data from local API context')

      const globalDocumentWithContext = await payload.findGlobal({
        slug: dataHooksGlobalSlug,
        context: {
          field_beforeChange_GlobalAndField_override: 'data from local API context',
        },
      })
      expect(globalDocumentWithContext.field_globalAndField).toEqual('data from local API context')
    })

    it('should pass context from rest API to hooks', async () => {
      const params = new URLSearchParams({
        context_secretValue: 'data from rest API',
      })
      // send context as query params. It will be parsed by the beforeOperation hook
      const { doc } = await restClient
        .POST(`/${contextHooksSlug}?${params.toString()}`, {
          body: JSON.stringify({
            value: 'wrongvalue',
          }),
        })
        .then((res) => res.json())

      const retrievedDoc = await payload.findByID({
        collection: contextHooksSlug,
        id: doc.id,
      })

      expect(retrievedDoc.value).toEqual('data from rest API')
    })
  })

  describe('auth collection hooks', () => {
    let hookUser
    let hookUserToken

    beforeAll(async () => {
      const email = 'dontrefresh@payloadcms.com'

      hookUser = await payload.create({
        collection: hooksUsersSlug,
        data: {
          email,
          password: devUser.password,
          roles: ['admin'],
        },
      })

      const { token } = await payload.login({
        collection: hooksUsersSlug,
        data: {
          email: hookUser.email,
          password: devUser.password,
        },
      })

      hookUserToken = token
    })

    it('should call afterLogin hook', async () => {
      const { user } = await payload.login({
        collection: hooksUsersSlug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      const result = await payload.findByID({
        id: user.id,
        collection: hooksUsersSlug,
      })

      expect(user).toBeDefined()
      expect(user.afterLoginHook).toStrictEqual(true)
      expect(result.afterLoginHook).toStrictEqual(true)
    })

    it('deny user login', async () => {
      await expect(() =>
        payload.login({
          collection: hooksUsersSlug,
          data: { email: regularUser.email, password: regularUser.password },
        }),
      ).rejects.toThrow(AuthenticationError)
    })

    it('should respect refresh hooks', async () => {
      const response = await restClient.POST(`/${hooksUsersSlug}/refresh-token`, {
        headers: {
          Authorization: `JWT ${hookUserToken}`,
        },
      })

      const data = await response.json()

      expect(data.exp).toStrictEqual(1)
      expect(data.refreshedToken).toStrictEqual('fake')
    })

    it('should respect me hooks', async () => {
      const response = await restClient.GET(`/${hooksUsersSlug}/me`, {
        headers: {
          Authorization: `JWT ${hookUserToken}`,
        },
      })

      const data = await response.json()

      expect(data.exp).toStrictEqual(10000)
    })
  })

  describe('hook parameter data', () => {
    it('should pass collection prop to collection hooks', async () => {
      const sanitizedConfig = await HooksConfig
      const sanitizedHooksCollection = JSON.parse(
        JSON.stringify(sanitizedConfig.collections.find(({ slug }) => slug === dataHooksSlug)),
      )

      const doc = await payload.create({
        collection: dataHooksSlug,
        data: {},
      })

      expect(JSON.parse(doc.collection_beforeOperation_collection)).toStrictEqual(
        sanitizedHooksCollection,
      )
      expect(JSON.parse(doc.collection_beforeChange_collection)).toStrictEqual(
        sanitizedHooksCollection,
      )
      expect(JSON.parse(doc.collection_afterChange_collection)).toStrictEqual(
        sanitizedHooksCollection,
      )
      expect(JSON.parse(doc.collection_afterRead_collection)).toStrictEqual(
        sanitizedHooksCollection,
      )
      expect(JSON.parse(doc.collection_afterOperation_collection)).toStrictEqual(
        sanitizedHooksCollection,
      )

      // BeforeRead is only run for find operations
      const foundDoc = await payload.findByID({
        id: doc.id,
        collection: dataHooksSlug,
      })

      expect(JSON.parse(foundDoc.collection_beforeRead_collection)).toStrictEqual(
        sanitizedHooksCollection,
      )
    })

    it('should pass collection and field props to field hooks', async () => {
      const sanitizedConfig = await HooksConfig
      const sanitizedHooksCollection = sanitizedConfig.collections.find(
        ({ slug }) => slug === dataHooksSlug,
      )

      const field = sanitizedHooksCollection.fields.find(
        (field) => 'name' in field && field.name === 'field_collectionAndField',
      )

      const doc = await payload.create({
        collection: dataHooksSlug,
        data: {},
      })

      const collectionAndField = JSON.stringify(sanitizedHooksCollection) + JSON.stringify(field)

      expect(doc.field_collectionAndField).toStrictEqual(collectionAndField + collectionAndField)
    })

    it('should pass global prop to global hooks', async () => {
      const sanitizedConfig = await HooksConfig
      const sanitizedHooksGlobal = JSON.parse(
        JSON.stringify(sanitizedConfig.globals.find(({ slug }) => slug === dataHooksGlobalSlug)),
      )

      const doc = await payload.updateGlobal({
        slug: dataHooksGlobalSlug,
        data: {},
      })

      expect(JSON.parse(doc.global_beforeChange_global)).toStrictEqual(sanitizedHooksGlobal)
      expect(JSON.parse(doc.global_afterRead_global)).toStrictEqual(sanitizedHooksGlobal)
      expect(JSON.parse(doc.global_afterChange_global)).toStrictEqual(sanitizedHooksGlobal)

      // beforeRead is only run for findOne operations
      const foundDoc = await payload.findGlobal({
        slug: dataHooksGlobalSlug,
      })

      expect(JSON.parse(foundDoc.global_beforeRead_global)).toStrictEqual(sanitizedHooksGlobal)
    })

    it('should pass global and field props to global hooks', async () => {
      const sanitizedConfig = await HooksConfig
      const sanitizedHooksGlobal = sanitizedConfig.globals.find(
        ({ slug }) => slug === dataHooksGlobalSlug,
      )

      const globalString = JSON.stringify(sanitizedHooksGlobal)

      const fieldString = JSON.stringify(
        sanitizedHooksGlobal.fields.find(
          (field) => 'name' in field && field.name === 'field_globalAndField',
        ),
      )

      const doc = await payload.updateGlobal({
        slug: dataHooksGlobalSlug,
        data: {},
      })

      const globalAndFieldString = globalString + fieldString

      expect(doc.field_globalAndField).toStrictEqual(globalAndFieldString + globalAndFieldString)
    })

    it('should pass correct field paths through field hooks', async () => {
      const formatExpectedFieldPaths = (
        fieldIdentifier: string,
        {
          path,
          schemaPath,
        }: {
          path: string[]
          schemaPath: string[]
        },
      ) => ({
        [`${fieldIdentifier}_beforeValidate_FieldPaths`]: {
          path,
          schemaPath,
        },
        [`${fieldIdentifier}_beforeChange_FieldPaths`]: {
          path,
          schemaPath,
        },
        [`${fieldIdentifier}_afterRead_FieldPaths`]: {
          path,
          schemaPath,
        },
        [`${fieldIdentifier}_beforeDuplicate_FieldPaths`]: {
          path,
          schemaPath,
        },
      })

      const originalDoc = await payload.create({
        collection: fieldPathsSlug,
        data: {
          topLevelNamedField: 'Test',
          array: [
            {
              fieldWithinArray: 'Test',
              nestedArray: [
                {
                  fieldWithinNestedArray: 'Test',
                  fieldWithinNestedRow: 'Test',
                },
              ],
            },
          ],
          fieldWithinRow: 'Test',
          fieldWithinUnnamedTab: 'Test',
          namedTab: {
            fieldWithinNamedTab: 'Test',
          },
          fieldWithinNestedUnnamedTab: 'Test',
        },
      })

      // duplicate the doc to ensure that the beforeDuplicate hook is run
      const doc = await payload.duplicate({
        id: originalDoc.id,
        collection: fieldPathsSlug,
      })

      expect(doc).toMatchObject({
        ...formatExpectedFieldPaths('topLevelNamedField', {
          path: ['topLevelNamedField'],
          schemaPath: ['topLevelNamedField'],
        }),
        ...formatExpectedFieldPaths('fieldWithinArray', {
          path: ['array', '0', 'fieldWithinArray'],
          schemaPath: ['array', 'fieldWithinArray'],
        }),
        ...formatExpectedFieldPaths('fieldWithinNestedArray', {
          path: ['array', '0', 'nestedArray', '0', 'fieldWithinNestedArray'],
          schemaPath: ['array', 'nestedArray', 'fieldWithinNestedArray'],
        }),
        ...formatExpectedFieldPaths('fieldWithinRowWithinArray', {
          path: ['array', '0', 'fieldWithinRowWithinArray'],
          schemaPath: ['array', '_index-2', 'fieldWithinRowWithinArray'],
        }),
        ...formatExpectedFieldPaths('fieldWithinRow', {
          path: ['fieldWithinRow'],
          schemaPath: ['_index-2', 'fieldWithinRow'],
        }),
        ...formatExpectedFieldPaths('fieldWithinUnnamedTab', {
          path: ['fieldWithinUnnamedTab'],
          schemaPath: ['_index-3-0', 'fieldWithinUnnamedTab'],
        }),
        ...formatExpectedFieldPaths('fieldWithinNestedUnnamedTab', {
          path: ['fieldWithinNestedUnnamedTab'],
          schemaPath: ['_index-3-0-1-0', 'fieldWithinNestedUnnamedTab'],
        }),
        ...formatExpectedFieldPaths('fieldWithinNamedTab', {
          path: ['namedTab', 'fieldWithinNamedTab'],
          schemaPath: ['_index-3', 'namedTab', 'fieldWithinNamedTab'],
        }),
      })
    })

    it('should assign value properly when missing in data', async () => {
      const doc = await payload.create({
        collection: valueHooksSlug,
        data: {
          slug: 'test',
        },
      })

      const updatedDoc = await payload.update({
        id: doc.id,
        collection: valueHooksSlug,
        data: {},
      })

      expect(updatedDoc.beforeValidate_value).toEqual('test')
      expect(updatedDoc.beforeChange_value).toEqual('test')
    })
  })

  describe('config level after error hook', () => {
    it('should handle error', async () => {
      const response = await restClient.GET(`/throw-to-after-error`, {})
      const body = await response.json()
      expect(response.status).toEqual(418)
      expect(body).toEqual({ errors: [{ message: "I'm a teapot" }] })
    })
  })

  describe('beforeValidate', () => {
    it('should have correct arguments', async () => {
      const doc = await payload.create({
        collection: beforeValidateSlug,
        data: {
          selection: 'b',
        },
      })

      const updateResult = await payload.update({
        id: doc.id,
        collection: beforeValidateSlug,
        data: {
          selection: 'a',
        },
        context: {
          beforeValidateTest: true,
        },
      })

      expect(updateResult).toBeDefined()
    })
  })
})
