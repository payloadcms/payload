import { AuthenticationError } from 'payload'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import {
  afterEach,
  beforeEach,
  describe,
  matchesDatabase,
  suite,
  test,
} from '../__helpers/int/vitest.js'
import { devUser, regularUser } from '../credentials.js'
import { afterOperationSlug } from './collections/AfterOperation/index.js'
import {
  beforeOperationSlug,
  clearLastOperation,
  getLastOperation,
} from './collections/BeforeOperation/index.js'
import { chainingHooksSlug } from './collections/ChainingHooks/index.js'
import { contextHooksSlug } from './collections/ContextHooks/index.js'
import { dataHooksSlug } from './collections/Data/index.js'
import { hooksSlug } from './collections/Hook/index.js'
import { nestedAfterChangeHooksSlug } from './collections/NestedAfterChangeHook/index.js'
import {
  generatedAfterReadText,
  nestedAfterReadHooksSlug,
} from './collections/NestedAfterReadHooks/index.js'
import { relationsSlug } from './collections/Relations/index.js'
import { transformSlug } from './collections/Transform/index.js'
import { hooksUsersSlug } from './collections/Users/index.js'
import { HooksConfig } from './config.js'
import { dataHooksGlobalSlug } from './globals/Data/index.js'
import { afterReadSlug, beforeValidateSlug, overrideAccessSlug } from './shared.js'

suite('Hooks', { config: './config.ts' }, () => {
  describe.runIf(matchesDatabase({ db: 'mongo' }))('transform actions', () => {
    test('should create and not throw an error', async ({ payload }) => {
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
    beforeEach(async ({ payload }) => {
      doc = await payload.create({
        collection: hooksSlug,
        data,
      })
    })

    test('should execute hooks in correct order on create', () => {
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

    test('should execute hooks in correct order on update', async ({ payload }) => {
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

    test('should execute hooks in correct order on find', async ({ payload }) => {
      doc = await payload.findByID({
        id: doc.id,
        collection: hooksSlug,
      })

      expect(doc.collectionAfterRead).toBeTruthy()
      expect(doc.collectionBeforeRead).toBeTruthy()
      expect(doc.fieldAfterRead).toBeTruthy()
    })

    test('should save data generated with afterRead hooks in nested field structures', async ({
      payload,
    }) => {
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

    test('should populate related docs within nested field structures', async ({ payload }) => {
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

    test('should pass result from previous hook into next hook with findByID', async ({
      payload,
    }) => {
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

    test('should pass result from previous hook into next hook with find', async ({ payload }) => {
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

    test('should execute collection afterOperation hook', async ({ payload }) => {
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

    test('should pass context from beforeChange to afterChange', async ({ payload }) => {
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

    test('should pass context from local API to hooks', async ({ payload }) => {
      const document = await payload.create({
        collection: contextHooksSlug,
        context: {
          secretValue: 'data from Local API',
        },
        data: {
          value: 'wrongvalue',
        },
      })

      const retrievedDoc = await payload.findByID({
        id: document.id,
        collection: contextHooksSlug,
      })

      expect(retrievedDoc.value).toEqual('data from Local API')
    })

    test('should pass context from Local API to global hooks', async ({ payload }) => {
      const globalDocument = await payload.findGlobal({
        slug: dataHooksGlobalSlug,
      })

      expect(globalDocument.field_globalAndField).not.toEqual('data from Local API context')

      const globalDocumentWithContext = await payload.findGlobal({
        slug: dataHooksGlobalSlug,
        context: {
          field_beforeChange_GlobalAndField_override: 'data from Local API context',
        },
      })
      expect(globalDocumentWithContext.field_globalAndField).toEqual('data from Local API context')
    })

    test('should pass context from REST API to hooks', async ({ payload, restClient }) => {
      const params = new URLSearchParams({
        context_secretValue: 'data from REST API',
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

      expect(retrievedDoc.value).toEqual('data from REST API')
    })

    test('should populate previousValue in nested afterChange hooks', async ({ payload }) => {
      // this collection will throw an error if previousValue is not defined in nested afterChange hook
      const nestedAfterChangeDoc = await payload.create({
        collection: nestedAfterChangeHooksSlug,
        data: {
          text: 'initial',
          group: {
            array: [
              {
                nestedAfterChange: 'initial',
              },
            ],
          },
        },
      })

      const updatedDoc = await payload.update({
        collection: 'nested-after-change-hooks',
        id: nestedAfterChangeDoc.id,
        data: {
          text: 'updated',
          group: {
            array: [
              {
                nestedAfterChange: 'updated',
              },
            ],
          },
        },
      })

      expect(updatedDoc).toBeDefined()
    })

    test('should populate previousValue in Lexical nested afterChange hooks', async ({
      payload,
    }) => {
      const relationID = await payload.create({
        collection: 'relations',
        data: {
          title: 'Relation for nested afterChange',
        },
      })

      // this collection will throw an error if previousValue is not defined in nested afterChange hook
      const nestedAfterChangeDoc = await payload.create({
        collection: nestedAfterChangeHooksSlug,
        data: {
          text: 'initial',
          group: {
            array: [
              {
                nestedAfterChange: 'initial',
              },
            ],
          },
          lexical: {
            root: {
              children: [
                {
                  children: [
                    {
                      children: [
                        {
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: 'link',
                          type: 'text',
                          version: 1,
                        },
                      ],
                      direction: null,
                      format: '',
                      indent: 0,
                      type: 'link',
                      version: 3,
                      fields: {
                        linkBlocks: [
                          {
                            id: '693ade72068ea07ba13edcab',
                            blockType: 'nestedLinkBlock',
                            nestedRelationship: relationID.id,
                          },
                        ],
                      },
                      id: '693ade70068ea07ba13edca9',
                    },
                  ],
                  direction: null,
                  format: '',
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                  textFormat: 0,
                  textStyle: '',
                },
                {
                  type: 'block',
                  version: 2,
                  format: '',
                  fields: {
                    id: '693adf3c068ea07ba13edcae',
                    blockName: '',
                    nestedAfterChange: 'test',
                    blockType: 'nestedBlock',
                  },
                },
                {
                  children: [],
                  direction: null,
                  format: '',
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                  textFormat: 0,
                  textStyle: '',
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          },
        },
      })

      await expect(
        payload.update({
          collection: 'nested-after-change-hooks',
          id: nestedAfterChangeDoc.id,
          data: {
            text: 'updated',
          },
        }),
      ).resolves.not.toThrow()
    })
  })

  describe('auth collection hooks', () => {
    let hookUser
    let hookUserToken

    beforeEach(async ({ payload }) => {
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

    test('should call afterLogin hook', async ({ payload }) => {
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

    test('should call afterLogin hook on password reset', async ({ payload }) => {
      const resetUser = await payload.create({
        collection: hooksUsersSlug,
        data: {
          email: 'reset-test@payloadcms.com',
          password: devUser.password,
          roles: ['admin'],
          afterLoginHook: false,
        },
      })

      expect(resetUser.afterLoginHook).toStrictEqual(false)

      const token = await payload.forgotPassword({
        collection: hooksUsersSlug,
        data: {
          email: resetUser.email,
        },
        disableEmail: true,
      })

      const { user } = await payload.resetPassword({
        collection: hooksUsersSlug,
        overrideAccess: true,
        data: {
          password: 'newPassword123',
          token,
        },
      })

      expect(user).toBeDefined()
      expect(user.afterLoginHook).toStrictEqual(true)

      const result = await payload.findByID({
        id: user.id,
        collection: hooksUsersSlug,
      })

      expect(result.afterLoginHook).toStrictEqual(true)
    })

    test('deny user login', async ({ payload }) => {
      await expect(() =>
        payload.login({
          collection: hooksUsersSlug,
          data: { email: regularUser.email, password: regularUser.password },
        }),
      ).rejects.toThrow(AuthenticationError)
    })

    test('should respect refresh hooks', async ({ restClient }) => {
      const response = await restClient.POST(`/${hooksUsersSlug}/refresh-token`, {
        headers: {
          Authorization: `JWT ${hookUserToken}`,
        },
      })

      const data = await response.json()

      expect(data.exp).toStrictEqual(1)
      expect(data.refreshedToken).toStrictEqual('fake')
    })

    test('should respect me hooks', async ({ restClient }) => {
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
    test('should pass collection prop to collection hooks', async ({ payload }) => {
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

    test('should pass collection and field props to field hooks', async ({ payload }) => {
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

    test('should pass global prop to global hooks', async ({ payload }) => {
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

    test('should pass global and field props to global hooks', async ({ payload }) => {
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
  })

  describe('config level after error hook', () => {
    test('should handle error', async ({ restClient }) => {
      const response = await restClient.GET(`/throw-to-after-error`, {})
      const body = await response.json()
      expect(response.status).toEqual(418)
      expect(body).toEqual({ errors: [{ message: "I'm a teapot" }] })
    })
  })

  describe('beforeValidate', () => {
    test('should have correct arguments', async ({ payload }) => {
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

  describe('beforeOperation', () => {
    afterEach(() => {
      clearLastOperation()
    })

    test('should pass correct operation arg on create', async ({ payload }) => {
      await payload.create({
        collection: beforeOperationSlug,
        data: {},
      })

      expect(getLastOperation()).toEqual('create')
    })

    test('should pass correct operation arg on update', async ({ payload }) => {
      const doc = await payload.create({
        collection: beforeOperationSlug,
        data: {},
      })

      await payload.update({
        id: doc.id,
        collection: beforeOperationSlug,
        data: {},
      })

      expect(getLastOperation()).toEqual('update')
    })

    test('should pass correct operation arg on updateByID', async ({ payload }) => {
      const doc = await payload.create({
        collection: beforeOperationSlug,
        data: {},
      })

      await payload.update({
        id: doc.id,
        collection: beforeOperationSlug,
        data: {},
      })

      expect(getLastOperation()).toEqual('update')
    })

    test('should pass correct operation arg on read (findByID)', async ({ payload }) => {
      const doc = await payload.create({
        collection: beforeOperationSlug,
        data: {},
      })

      await payload.findByID({
        id: doc.id,
        collection: beforeOperationSlug,
      })

      expect(getLastOperation()).toEqual('read')
    })

    test('should pass correct operation arg on read (find)', async ({ payload }) => {
      await payload.create({
        collection: beforeOperationSlug,
        data: {},
      })

      clearLastOperation()

      await payload.find({
        collection: beforeOperationSlug,
      })

      expect(getLastOperation()).toEqual('read')
    })

    test('should pass correct operation arg on readDistinct (findDistinct)', async ({
      payload,
    }) => {
      await payload.create({
        collection: beforeOperationSlug,
        data: { category: 'test1' },
      })
      await payload.create({
        collection: beforeOperationSlug,
        data: { category: 'test2' },
      })
      await payload.create({
        collection: beforeOperationSlug,
        data: { category: 'test1' },
      })

      await payload.findDistinct({
        collection: beforeOperationSlug,
        field: 'category',
      })

      expect(getLastOperation()).toEqual('readDistinct')
    })

    test('should pass correct operation arg on delete', async ({ payload }) => {
      const doc = await payload.create({
        collection: beforeOperationSlug,
        data: {},
      })

      await payload.delete({
        id: doc.id,
        collection: beforeOperationSlug,
      })

      expect(getLastOperation()).toEqual('delete')
    })

    test('should pass correct operation arg on deleteByID', async ({ payload }) => {
      const doc = await payload.create({
        collection: beforeOperationSlug,
        data: {},
      })

      await payload.delete({
        id: doc.id,
        collection: beforeOperationSlug,
      })

      expect(getLastOperation()).toEqual('delete')
    })

    test('should pass correct operation arg on count', async ({ payload }) => {
      await payload.create({
        collection: beforeOperationSlug,
        data: {},
      })

      await payload.count({
        collection: beforeOperationSlug,
      })

      expect(getLastOperation()).toEqual('count')
    })

    test('should pass correct operation arg on countVersions', async ({ payload }) => {
      const doc = await payload.create({
        collection: beforeOperationSlug,
        data: {},
      })

      await payload.countVersions({
        collection: beforeOperationSlug,
        where: {
          parent: {
            equals: doc.id,
          },
        },
      })

      expect(getLastOperation()).toEqual('countVersions')
    })

    test('should pass correct operation arg on findVersions', async ({ payload }) => {
      const doc = await payload.create({
        collection: beforeOperationSlug,
        data: {},
      })

      await payload.findVersions({
        collection: beforeOperationSlug,
        where: {
          parent: {
            equals: doc.id,
          },
        },
      })

      expect(getLastOperation()).toEqual('read')
    })

    test('should pass correct operation arg on findVersionByID', async ({ payload }) => {
      const doc = await payload.create({
        collection: beforeOperationSlug,
        data: { category: 'v1' },
      })

      // Update to create a version
      await payload.update({
        id: doc.id,
        collection: beforeOperationSlug,
        data: { category: 'v2' },
      })

      const versions = await payload.findVersions({
        collection: beforeOperationSlug,
        where: {
          parent: {
            equals: doc.id,
          },
        },
      })

      expect(versions.docs.length).toBeGreaterThan(0)

      await payload.findVersionByID({
        collection: beforeOperationSlug,
        id: versions.docs[0]!.id,
      })

      expect(getLastOperation()).toEqual('read')
    })

    test('should pass correct operation arg on restoreVersion', async ({ payload }) => {
      const doc = await payload.create({
        collection: beforeOperationSlug,
        data: { category: 'v1' },
      })

      // Update to create a version
      await payload.update({
        id: doc.id,
        collection: beforeOperationSlug,
        data: { category: 'v2' },
      })

      const versions = await payload.findVersions({
        collection: beforeOperationSlug,
        where: {
          parent: {
            equals: doc.id,
          },
        },
      })

      expect(versions.docs.length).toBeGreaterThan(0)

      await payload.restoreVersion({
        collection: beforeOperationSlug,
        id: versions.docs[0]!.id,
      })

      expect(getLastOperation()).toEqual('restoreVersion')
    })
  })

  describe('afterRead', () => {
    test('should return same for find and findByID', async ({ payload }) => {
      const createdDoc = await payload.create({
        collection: afterReadSlug,
        data: {
          title: 'test',
        },
      })

      const docFromFind = await payload.findByID({
        collection: afterReadSlug,
        id: createdDoc.id,
      })

      const { docs } = await payload.find({
        collection: afterReadSlug,
        where: {
          id: {
            equals: createdDoc.id,
          },
        },
      })

      const docFromFindMany = docs[0]

      expect(docFromFind.title).toEqual('afterRead')
      expect(docFromFindMany.title).toEqual('afterRead')
      expect(docFromFind.title).toEqual(docFromFindMany.title)
    })
  })

  describe('overrideAccess in hooks', () => {
    const createdIDs: string[] = []

    afterEach(async ({ payload }) => {
      for (const id of createdIDs) {
        await payload.delete({ collection: overrideAccessSlug, id })
      }
      createdIDs.length = 0
    })

    test('should pass overrideAccess: false to hooks when not overriding', async ({ payload }) => {
      const doc = await payload.create({
        collection: overrideAccessSlug,
        data: { title: 'Test' },
        overrideAccess: true,
      })

      createdIDs.push(doc.id)

      const result = await payload.findByID({
        collection: overrideAccessSlug,
        id: doc.id,
        overrideAccess: false,
      })

      expect(result.beforeReadCalled).toBe(true)
      expect(result.afterReadCalled).toBe(true)
      expect(result.beforeReadOverrideAccess).toBe(false)
      expect(result.afterReadOverrideAccess).toBe(false)
    })

    test('should pass overrideAccess: true to hooks when overriding', async ({ payload }) => {
      const doc = await payload.create({
        collection: overrideAccessSlug,
        data: { title: 'Test' },
        overrideAccess: true,
      })

      createdIDs.push(doc.id)

      const result = await payload.findByID({
        collection: overrideAccessSlug,
        id: doc.id,
        overrideAccess: true,
      })

      expect(result.beforeReadCalled).toBe(true)
      expect(result.afterReadCalled).toBe(true)
      expect(result.beforeReadOverrideAccess).toBe(true)
      expect(result.afterReadOverrideAccess).toBe(true)
    })

    test('should pass overrideAccess to hooks in find operation', async ({ payload }) => {
      const doc = await payload.create({
        collection: overrideAccessSlug,
        data: { title: 'Test Find' },
        overrideAccess: true,
      })

      createdIDs.push(doc.id)

      const { docs } = await payload.find({
        collection: overrideAccessSlug,
        where: {
          id: {
            equals: doc.id,
          },
        },
        overrideAccess: true,
      })

      const result = docs[0]

      expect(result.beforeReadCalled).toBe(true)
      expect(result.afterReadCalled).toBe(true)
      expect(result.beforeReadOverrideAccess).toBe(true)
      expect(result.afterReadOverrideAccess).toBe(true)
    })

    test('should pass overrideAccess: false to hooks in find operation when not overriding', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: overrideAccessSlug,
        data: { title: 'Test Find No Override' },
        overrideAccess: true,
      })

      createdIDs.push(doc.id)

      const { docs } = await payload.find({
        collection: overrideAccessSlug,
        where: {
          id: {
            equals: doc.id,
          },
        },
        overrideAccess: false,
      })

      const result = docs[0]

      expect(result.beforeReadCalled).toBe(true)
      expect(result.afterReadCalled).toBe(true)
      expect(result.beforeReadOverrideAccess).toBe(false)
      expect(result.afterReadOverrideAccess).toBe(false)
    })

    test('should default to true when overrideAccess is not specified in Local API', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: overrideAccessSlug,
        data: { title: 'Test Default' },
      })

      createdIDs.push(doc.id)

      const result = await payload.findByID({
        collection: overrideAccessSlug,
        id: doc.id,
      })

      expect(result.beforeReadCalled).toBe(true)
      expect(result.afterReadCalled).toBe(true)
      expect(result.beforeReadOverrideAccess).toBe(true)
      expect(result.afterReadOverrideAccess).toBe(true)
    })
  })
})
