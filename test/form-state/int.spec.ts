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
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname, undefined, true))

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
      mockRSCs: true,
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
      mockRSCs: true,
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
        lastRenderedPath: 'title',
      },
    })
  })

  it('should not render custom components when `lastRenderedPath` exists', async () => {
    const req = await createLocalReq({ user }, payload)

    const { state: stateWithRow } = await buildFormState({
      mockRSCs: true,
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

    // Ensure that row 1 _DOES_ return with rendered components
    expect(stateWithRow?.['array.0.richText']?.lastRenderedPath).toStrictEqual('array.0.richText')
    expect(stateWithRow?.['array.0.richText']?.customComponents?.Field).toBeDefined()

    const { state: stateWithTitle } = await buildFormState({
      mockRSCs: true,
      collectionSlug: postsSlug,
      formState: {
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
      schemaPath: postsSlug,
      req,
    })

    // Ensure that row 1 _DOES NOT_ return with rendered components
    expect(stateWithTitle?.['array.0.richText']).toHaveProperty('lastRenderedPath')
    expect(stateWithTitle?.['array.0.richText']).not.toHaveProperty('customComponents')

    // Ensure that row 2 _DOES_ return with rendered components
    expect(stateWithTitle?.['array.1.richText']).toHaveProperty('lastRenderedPath')
    expect(stateWithTitle?.['array.1.richText']).toHaveProperty('customComponents')
    expect(stateWithTitle?.['array.1.richText']?.customComponents?.Field).toBeDefined()
  })
})
