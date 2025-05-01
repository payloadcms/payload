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
        addedByServer: true,
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
    expect(stateWithRow?.['array.0.customTextField']?.lastRenderedPath).toStrictEqual(
      'array.0.customTextField',
    )
    expect(stateWithRow?.['array.0.customTextField']?.customComponents?.Field).toBeDefined()

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
        'array.0.customTextField': {
          lastRenderedPath: 'array.0.customTextField',
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
    expect(stateWithTitle?.['array.0.customTextField']).toHaveProperty('lastRenderedPath')
    expect(stateWithTitle?.['array.0.customTextField']).not.toHaveProperty('customComponents')

    // Ensure that row 2 _DOES_ return with rendered components
    expect(stateWithTitle?.['array.1.customTextField']).toHaveProperty('lastRenderedPath')
    expect(stateWithTitle?.['array.1.customTextField']).toHaveProperty('customComponents')
    expect(stateWithTitle?.['array.1.customTextField']?.customComponents?.Field).toBeDefined()
  })

  it('should add `addedByServer` flag to fields that originate on the server', async () => {
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
    })

    expect(state.title?.addedByServer).toBe(true)

    // Ensure that `addedByServer` is removed after being received by the client
    const newState = mergeServerFormState({
      currentState: state,
      incomingState: state,
    })

    expect(newState.title?.addedByServer).toBeUndefined()
  })

  it('should not omit value and initialValue from fields added by the server', () => {
    const currentState: FormState = {
      array: {
        rows: [
          {
            id: '1',
          },
        ],
      },
    }

    const serverState: FormState = {
      array: {
        rows: [
          {
            id: '1',
          },
        ],
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
      },
      'array.0.customTextField': {
        value: 'Test',
        initialValue: 'Test',
        addedByServer: true,
      },
    }

    const newState = mergeServerFormState({
      currentState,
      incomingState: serverState,
    })

    expect(newState['array.0.customTextField']).toStrictEqual({
      passesCondition: true,
      valid: true,
      value: 'Test',
      initialValue: 'Test',
    })
  })

  it('should merge array rows without losing rows added to local state', () => {
    const currentState: FormState = {
      array: {
        rows: [
          {
            id: '1',
            lastRenderedPath: 'array.0.customTextField',
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
            lastRenderedPath: 'array.0.customTextField',
          },
        ],
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
      },
      'array.0.customTextField': {
        value: 'Test',
        initialValue: 'Test',
        addedByServer: true,
      },
    }

    const newState = mergeServerFormState({
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
            lastRenderedPath: 'array.0.customTextField',
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
      'array.0.customTextField': {
        value: 'Test',
        initialValue: 'Test',
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
            lastRenderedPath: 'array.0.customTextField',
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
            lastRenderedPath: 'array.0.customTextField',
          },
          {
            id: '2',
            lastRenderedPath: 'array.1.customTextField',
          },
        ],
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
      },
      'array.0.customTextField': {
        value: 'Test',
        initialValue: 'Test',
        addedByServer: true,
      },
      'array.1.id': {
        value: '2',
        initialValue: '2',
      },
      'array.1.customTextField': {
        value: 'Test',
        initialValue: 'Test',
      },
    }

    const newState = mergeServerFormState({
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
            lastRenderedPath: 'array.0.customTextField',
          },
        ],
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
        passesCondition: true,
        valid: true,
      },
      'array.0.customTextField': {
        value: 'Test',
        initialValue: 'Test',
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
            lastRenderedPath: 'array.0.customTextField',
            isLoading: false,
          },
        ],
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
      },
      'array.0.customTextField': {
        value: 'Test',
        initialValue: 'Test',
        addedByServer: true,
      },
    }

    const newState = mergeServerFormState({
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
            lastRenderedPath: 'array.0.customTextField',
            isLoading: false,
          },
        ],
      },
      'array.0.id': {
        passesCondition: true,
        valid: true,
        value: '1',
        initialValue: '1',
      },
      'array.0.customTextField': {
        passesCondition: true,
        valid: true,
        value: 'Test',
        initialValue: 'Test',
      },
    })
  })

  it('should return the same object reference when only modifying a value', () => {
    const currentState = {
      title: {
        value: 'Test Post',
        initialValue: 'Test Post',
        valid: true,
        passesCondition: true,
      },
    }

    const newState = mergeServerFormState({
      currentState,
      incomingState: {
        title: {
          value: 'Test Post (modified)',
          initialValue: 'Test Post',
          valid: true,
          passesCondition: true,
        },
      },
    })

    expect(newState === currentState).toBe(true)
  })
})
