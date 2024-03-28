import type { NestedAfterReadHook } from './payload-types'

import payload from '../../packages/payload/src'
import { AuthenticationError } from '../../packages/payload/src/errors'
import { devUser, regularUser } from '../credentials'
import { initPayloadTest } from '../helpers/configHelpers'
import { RESTClient } from '../helpers/rest'
import { afterOperationSlug } from './collections/AfterOperation'
import { chainingHooksSlug } from './collections/ChainingHooks'
import { contextHooksSlug } from './collections/ContextHooks'
import { dataHooksSlug } from './collections/Data'
import { hooksSlug } from './collections/Hook'
import {
  generatedAfterReadText,
  nestedAfterReadHooksSlug,
} from './collections/NestedAfterReadHooks'
import { relationsSlug } from './collections/Relations'
import { transformSlug } from './collections/Transform'
import { hooksUsersSlug } from './collections/Users'
import configPromise, { HooksConfig } from './config'
import { dataHooksGlobalSlug } from './globals/Data'

let client: RESTClient
let apiUrl

describe('Hooks', () => {
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } })
    const config = await configPromise
    client = new RESTClient(config, { defaultSlug: transformSlug, serverURL })
    apiUrl = `${serverURL}/api`
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy(payload)
    }
  })

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

    it('should execute hooks in correct order on create', async () => {
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
      const document: NestedAfterReadHook = await payload.create({
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

    it('should retrieve data generated with afterRead hook from async virtual field in nested field structures', async () => {
      const relation = await payload.create({
        collection: relationsSlug,
        data: {
          title: 'Hello',
        },
      })

      const document: NestedAfterReadHook = await payload.create({
        collection: nestedAfterReadHooksSlug,
        data: {
          group: { array: [{ input: 'input' }] },
          text: 'ok',
        },
      })

      const retrievedDoc = await payload.findByID({
        id: document.id,
        collection: nestedAfterReadHooksSlug,
        depth: 1,
      })

      expect(retrievedDoc.group.subGroup.blocks[0].shouldPopulateVirtual[0]).toEqual(relation)
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
      const response = await fetch(`${apiUrl}/${contextHooksSlug}?${params.toString()}`, {
        body: JSON.stringify({
          value: 'wrongvalue',
        }),
        method: 'post',
      })

      const document = (await response.json()).doc

      const retrievedDoc = await payload.findByID({
        id: document.id,
        collection: contextHooksSlug,
      })

      expect(retrievedDoc.value).toEqual('data from rest API')
    })
  })

  describe('auth collection hooks', () => {
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
  })

  describe('config level after error hook', () => {
    it('should handle error', async () => {
      const response = await fetch(`${apiUrl}/throw-to-after-error`)
      const body = await response.json()
      expect(response.status).toEqual(418)
      expect(body).toEqual({ errors: [{ message: "I'm a teapot" }] })
    })
  })
})
