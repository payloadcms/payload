import type { FormState, Payload, User } from 'payload'

import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { postsSlug } from './collections/Posts/index.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports
import { mergeServerFormState } from '../../packages/ui/src/forms/Form/mergeServerFormState.js'

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
    expect(stateWithRow?.['array.0.text']?.lastRenderedPath).toStrictEqual('array.0.text')
    expect(stateWithRow?.['array.0.text']?.customComponents?.Field).toBeDefined()

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
        'array.0.text': {
          lastRenderedPath: 'array.0.text',
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
    expect(stateWithTitle?.['array.0.text']).toHaveProperty('lastRenderedPath')
    expect(stateWithTitle?.['array.0.text']).not.toHaveProperty('customComponents')

    // Ensure that row 2 _DOES_ return with rendered components
    expect(stateWithTitle?.['array.1.text']).toHaveProperty('lastRenderedPath')
    expect(stateWithTitle?.['array.1.text']).toHaveProperty('customComponents')
    expect(stateWithTitle?.['array.1.text']?.customComponents?.Field).toBeDefined()
  })

  it('should merge array rows without losing rows added to local state', () => {
    const currentState: FormState = {
      array: {
        rows: [
          {
            id: '1',
            lastRenderedPath: 'array.0.text',
          },
          {
            id: '2',
            isLoading: true,
          },
        ],
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
      },
      'array.1.id': {
        value: '2',
        initialValue: '2',
      },
    }

    const serverState: FormState = {
      array: {
        rows: [
          {
            id: '1',
            lastRenderedPath: 'array.0.text',
          },
        ],
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
      },
    }

    const { newState } = mergeServerFormState({
      currentState,
      incomingState: serverState,
    })

    // Row 2 should still exist
    expect(newState).toStrictEqual({
      array: {
        passesCondition: true,
        valid: true,
        rows: [
          {
            id: '1',
            lastRenderedPath: 'array.0.text',
          },
          {
            id: '2',
            isLoading: true,
          },
        ],
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
        passesCondition: true,
        valid: true,
      },
      'array.1.id': {
        value: '2',
        initialValue: '2',
      },
    })
  })

  it('should merge array rows without bringing back rows deleted from local state', () => {
    const currentState: FormState = {
      array: {
        rows: [
          {
            id: '1',
            lastRenderedPath: 'array.0.text',
          },
        ],
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
      },
    }

    const serverState: FormState = {
      array: {
        rows: [
          {
            id: '1',
            lastRenderedPath: 'array.0.text',
          },
          {
            id: '2',
            lastRenderedPath: 'array.1.text',
          },
        ],
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
      },
      'array.1.id': {
        value: '2',
        initialValue: '2',
      },
    }

    const { newState } = mergeServerFormState({
      currentState,
      incomingState: serverState,
    })

    // Row 2 should not exist
    expect(newState).toStrictEqual({
      array: {
        passesCondition: true,
        valid: true,
        rows: [
          {
            id: '1',
            lastRenderedPath: 'array.0.text',
          },
        ],
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
        passesCondition: true,
        valid: true,
      },
    })
  })

  it('should merge new fields returned from the server that do not yet exist in local state', () => {
    const currentState: FormState = {
      array: {
        rows: [
          {
            id: '1',
            isLoading: true,
          },
        ],
      },
    }

    const serverState: FormState = {
      array: {
        rows: [
          {
            id: '1',
            lastRenderedPath: 'array.0.text',
            isLoading: false,
          },
        ],
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
        addedByServer: true,
      },
      'array.0.text': {
        value: 'Test',
        initialValue: 'Test',
        addedByServer: true,
      },
    }

    const { newState } = mergeServerFormState({
      currentState,
      incomingState: serverState,
    })

    expect(newState).toStrictEqual({
      array: {
        passesCondition: true,
        valid: true,
        rows: [
          {
            id: '1',
            lastRenderedPath: 'array.0.text',
            isLoading: false,
          },
        ],
      },
      'array.0.id': {
        passesCondition: true,
        valid: true,
      },
      'array.0.text': {
        passesCondition: true,
        valid: true,
      },
    })
  })
})
