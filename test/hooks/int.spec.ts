import hash from 'object-hash'

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
    client = new RESTClient(config, { serverURL, defaultSlug: transformSlug })
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
          transform: [2, 8],
          localizedTransform: [2, 8],
        },
      })

      expect(doc.transform).toBeDefined()
      expect(doc.localizedTransform).toBeDefined()
    })
  })

  describe('hook execution', () => {
    let doc
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
      })

      expect(doc.fieldBeforeValidate).toEqual(true)
      expect(doc.collectionBeforeValidate).toEqual(true)
      expect(doc.fieldBeforeChange).toEqual(true)
      expect(doc.collectionBeforeChange).toEqual(true)
      expect(doc.fieldAfterChange).toEqual(true)
      expect(doc.collectionAfterChange).toEqual(true)
      expect(doc.fieldAfterRead).toEqual(true)
    })

    it('should save data generated with afterRead hooks in nested field structures', async () => {
      const document: NestedAfterReadHook = await payload.create({
        collection: nestedAfterReadHooksSlug,
        data: {
          text: 'ok',
          group: {
            array: [{ input: 'input' }],
          },
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
      })

      const retrievedDoc = await payload.findByID({
        collection: nestedAfterReadHooksSlug,
        id: document.id,
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
        collection: chainingHooksSlug,
        id: document.id,
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
          collection: afterOperationSlug,
          id: doc1.id,
          data: {
            title: 'Title',
          },
        }),
        await payload.update({
          collection: afterOperationSlug,
          id: doc2.id,
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
        collection: contextHooksSlug,
        id: document.id,
      })

      expect(retrievedDoc.value).toEqual('secret')
    })

    it('should pass context from local API to hooks', async () => {
      const document = await payload.create({
        collection: contextHooksSlug,
        data: {
          value: 'wrongvalue',
        },
        context: {
          secretValue: 'data from local API',
        },
      })

      const retrievedDoc = await payload.findByID({
        collection: contextHooksSlug,
        id: document.id,
      })

      expect(retrievedDoc.value).toEqual('data from local API')
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
        collection: contextHooksSlug,
        id: document.id,
      })

      expect(retrievedDoc.value).toEqual('data from rest API')
    })
  })

  describe('auth collection hooks', () => {
    it('allow admin login', async () => {
      const { user } = await payload.login({
        collection: hooksUsersSlug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })
      expect(user).toBeDefined()
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
      const sanitizedHooksCollection = sanitizedConfig.collections.find(
        ({ slug }) => slug === dataHooksSlug,
      )

      const collectionHash = hash(JSON.stringify(sanitizedHooksCollection))

      const doc = await payload.create({
        collection: dataHooksSlug,
        data: {},
      })

      expect(doc.collection_beforeOperation_collection).toEqual(collectionHash)
      expect(doc.collection_beforeChange_collection).toEqual(collectionHash)
      expect(doc.collection_afterChange_collection).toEqual(collectionHash)
      expect(doc.collection_afterRead_collection).toEqual(collectionHash)
      expect(doc.collection_afterOperation_collection).toEqual(collectionHash)

      // BeforeRead is only run for find operations
      const foundDoc = await payload.findByID({
        collection: dataHooksSlug,
        id: doc.id,
      })

      expect(foundDoc.collection_beforeRead_collection).toEqual(collectionHash)
    })

    it('should pass collection and field props to field hooks', async () => {
      const sanitizedConfig = await HooksConfig
      const sanitizedHooksCollection = sanitizedConfig.collections.find(
        ({ slug }) => slug === dataHooksSlug,
      )

      const collectionHash = hash(JSON.stringify(sanitizedHooksCollection))

      const fieldHash = hash(
        JSON.stringify(
          sanitizedHooksCollection.fields.find(
            (field) => 'name' in field && field.name === 'field_collectionAndField',
          ),
        ),
      )

      const doc = await payload.create({
        collection: dataHooksSlug,
        data: {},
      })

      const collectionAndFieldHash = collectionHash + fieldHash

      expect(doc.field_collectionAndField).toEqual(collectionAndFieldHash + collectionAndFieldHash)
    })

    it('should pass global prop to global hooks', async () => {
      const sanitizedConfig = await HooksConfig
      const sanitizedHooksGlobal = sanitizedConfig.globals.find(
        ({ slug }) => slug === dataHooksGlobalSlug,
      )

      const globalHash = hash(JSON.stringify(sanitizedHooksGlobal))

      const doc = await payload.updateGlobal({
        slug: dataHooksGlobalSlug,
        data: {},
      })

      expect(doc.global_beforeChange_global).toEqual(globalHash)
      expect(doc.global_afterRead_global).toEqual(globalHash)
      expect(doc.global_afterChange_global).toEqual(globalHash)

      // beforeRead is only run for findOne operations
      const foundDoc = await payload.findGlobal({
        slug: dataHooksGlobalSlug,
      })

      expect(foundDoc.global_beforeRead_global).toEqual(globalHash)
    })

    it('should pass global and field props to global hooks', async () => {
      const sanitizedConfig = await HooksConfig
      const sanitizedHooksGlobal = sanitizedConfig.globals.find(
        ({ slug }) => slug === dataHooksGlobalSlug,
      )

      const globalHash = hash(JSON.stringify(sanitizedHooksGlobal))

      const fieldHash = hash(
        JSON.stringify(
          sanitizedHooksGlobal.fields.find(
            (field) => 'name' in field && field.name === 'field_globalAndField',
          ),
        ),
      )

      const doc = await payload.updateGlobal({
        slug: dataHooksGlobalSlug,
        data: {},
      })

      const globalAndFieldHash = globalHash + fieldHash

      expect(doc.field_globalAndField).toEqual(globalAndFieldHash + globalAndFieldHash)
    })
  })
})
