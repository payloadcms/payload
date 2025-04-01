import type { Payload, User } from 'payload'

import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { postsSlug } from './collections/Posts/index.js'

let payload: Payload
let token: string
let restClient: NextRESTClient
let user: User

const { email, password } = devUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Form State', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname, undefined, true, false))

    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email,
          password,
        }),
      })
      .then((res) => res.json())

    token = data.token
    user = data.user
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should build entire form state', async () => {
    const req = await createLocalReq({ user }, payload)

    const postData = await payload.create({
      collection: postsSlug,
      data: {
        title: 'Test Post',
      },
    })

    const { state } = await buildFormState({
      id: postData.id,
      collectionSlug: postsSlug,
      data: postData,
      docPermissions: {
        create: true,
        delete: true,
        fields: true,
        read: true,
        readVersions: true,
        update: true,
      },
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: postsSlug,
    })

    expect(state).toMatchObject({
      title: {
        value: postData.title,
        initialValue: postData.title,
      },
      updatedAt: {
        value: postData.updatedAt,
        initialValue: postData.updatedAt,
      },
      createdAt: {
        value: postData.createdAt,
        initialValue: postData.createdAt,
      },
      renderTracker: {},
      validateUsingEvent: {},
      blocks: {
        initialValue: 0,
        requiresRender: false,
        rows: [],
        value: 0,
      },
    })
  })

  it('should use `select` to build partial form state with only specified fields', async () => {
    const req = await createLocalReq({ user }, payload)

    const postData = await payload.create({
      collection: postsSlug,
      data: {
        title: 'Test Post',
      },
    })

    const { state } = await buildFormState({
      id: postData.id,
      collectionSlug: postsSlug,
      data: postData,
      docPermissions: undefined,
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: postsSlug,
      select: {
        title: true,
      },
    })

    expect(state).toStrictEqual({
      title: {
        value: postData.title,
        initialValue: postData.title,
      },
    })
  })

  it('should not unnecessarily re-render custom components when adding a row and then editing a field', async () => {
    const req = await createLocalReq({ user }, payload)

    const { state: stateWithRow } = await buildFormState({
      collectionSlug: postsSlug,
      formState: {
        array: {
          rows: [
            {
              id: '123',
            },
          ],
        },
        'array.0.id': {
          value: '123',
          initialValue: '123',
        },
      },
      docPermissions: undefined,
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: postsSlug,
    })

    // Ensure that row 1 returns with rendered components
    expect(stateWithRow['array']?.lastRenderedPath).toStrictEqual('array')
    expect(stateWithRow['array.0.richText']?.lastRenderedPath).toStrictEqual('array.0.richText')
    expect(stateWithRow['array.0.richText']?.customComponents?.Field).toBeDefined()

    const { state: stateWithTitle } = await buildFormState({
      collectionSlug: postsSlug,
      formState: {
        title: {
          value: 'Test Post',
          initialValue: 'Test Post',
        },
        array: {
          rows: [
            {
              id: '123',
            },
            {
              id: '456',
            },
          ],
        },
        'array.0.id': {
          value: '123',
          initialValue: '123',
        },
        'array.0.richText': {
          lastRenderedPath: 'array.0.richText',
        },
        'array.1.id': {
          value: '456',
          initialValue: '456',
        },
      },
      docPermissions: undefined,
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: postsSlug,
    })

    // Ensure that row 1 DOES NOT return with rendered components
    expect(stateWithTitle['array']?.lastRenderedPath).toStrictEqual('array')
    expect(stateWithTitle['array.0.richText']).not.toHaveProperty('lastRenderedPath')
    expect(stateWithTitle['array.0.richText']).not.toHaveProperty('customComponents')
  })

  it('should not unnecessarily re-render custom components when adding rows back-to-back', async () => {
    const req = await createLocalReq({ user }, payload)

    const { state: stateWith1Row } = await buildFormState({
      collectionSlug: postsSlug,
      formState: {
        array: {
          rows: [
            {
              id: '123',
            },
          ],
        },
        'array.0.id': {
          value: '123',
          initialValue: '123',
        },
      },
      docPermissions: undefined,
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: postsSlug,
    })

    // Ensure that row 1 returns rendered components
    expect(stateWith1Row['array']?.lastRenderedPath).toStrictEqual('array')
    expect(stateWith1Row['array.0.richText']?.lastRenderedPath).toStrictEqual('array.0.richText')
    expect(stateWith1Row['array.0.richText']?.customComponents?.Field).toBeDefined()

    const { state: stateWith2Rows } = await buildFormState({
      collectionSlug: postsSlug,
      formState: {
        array: {
          lastRenderedPath: 'array',
          rows: [
            {
              id: '123',
            },
            {
              id: '456',
            },
          ],
        },
        'array.0.id': {
          value: '123',
          initialValue: '123',
        },
        'array.0.richText': {
          lastRenderedPath: 'array.0.richText',
        },
        'array.1.id': {
          value: '456',
          initialValue: '456',
        },
      },
      docPermissions: undefined,
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: postsSlug,
    })

    // Ensure that row 1 DOES NOT return rendered components
    // But row 2 DOES return rendered components
    expect(stateWith2Rows['array']?.lastRenderedPath).toStrictEqual('array')
    expect(stateWith2Rows['array.0.richText']).not.toHaveProperty('lastRenderedPath')
    expect(stateWith2Rows['array.0.richText']).not.toHaveProperty('customComponents')
    expect(stateWith2Rows['array.1.richText']?.lastRenderedPath).toStrictEqual('array.1.richText')
    expect(stateWith2Rows['array.1.richText']?.customComponents?.Field).toBeDefined()
  })
})
