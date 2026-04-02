import type { FieldState, FormState, Payload, User } from 'payload'
import type React from 'react'

import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { postsSlug } from './collections/Posts/index.js'

// eslint-disable-next-line payload/no-relative-monorepo-imports
import { mergeServerFormState } from '../../packages/ui/src/forms/Form/mergeServerFormState.js'

let payload: Payload
let restClient: NextRESTClient
let user: User

const { email, password } = devUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const DummyReactComponent: React.ReactNode = {
  // @ts-expect-error - can ignore, needs to satisfy `typeof value.$$typeof === 'symbol'`
  $$typeof: Symbol.for('react.element'),
  type: 'div',
  props: {},
  key: null,
}

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
    await payload.destroy()
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
        blocks: [
          {
            blockType: 'text',
            text: 'Test block',
          },
        ],
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
    expect(state['blocks.0.blockType']?.addedByServer).toBe(true)

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
        errorPaths: [],
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
        errorPaths: [],
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

  it('should accept all values from the server regardless of local modifications, e.g. `acceptAllValues` on submit', () => {
    const title: FieldState = {
      value: 'Test Post (modified on the client)',
      initialValue: 'Test Post',
      valid: true,
      passesCondition: true,
    }

    const currentState: Record<string, FieldState> = {
      title: {
        ...title,
        isModified: true, // This is critical, this is what we're testing
      },
      computedTitle: {
        value: 'Test Post (computed on the client)',
        initialValue: 'Test Post',
        valid: true,
        passesCondition: true,
      },
      array: {
        rows: [
          {
            id: '1',
            customComponents: {
              RowLabel: DummyReactComponent,
            },
            lastRenderedPath: 'array.0.customTextField',
          },
        ],
        valid: true,
        passesCondition: true,
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
        valid: true,
        passesCondition: true,
      },
      'array.0.customTextField': {
        value: 'Test Post (modified on the client)',
        initialValue: 'Test Post',
        valid: true,
        passesCondition: true,
      },
    }

    const incomingStateFromServer: Record<string, FieldState> = {
      title: {
        value: 'Test Post (modified on the server)',
        initialValue: 'Test Post',
        valid: true,
        passesCondition: true,
      },
      computedTitle: {
        value: 'Test Post (computed on the server)',
        initialValue: 'Test Post',
        valid: true,
        passesCondition: true,
      },
      array: {
        rows: [
          {
            id: '1',
            lastRenderedPath: 'array.0.customTextField',
            // Omit `customComponents` because the server did not re-render this row
          },
        ],
        passesCondition: true,
        valid: true,
      },
      'array.0.id': {
        value: '1',
        initialValue: '1',
        valid: true,
        passesCondition: true,
      },
      'array.0.customTextField': {
        value: 'Test Post (modified on the client)',
        initialValue: 'Test Post',
        valid: true,
        passesCondition: true,
      },
    }

    const newState = mergeServerFormState({
      acceptValues: true,
      currentState,
      incomingState: incomingStateFromServer,
    })

    expect(newState).toStrictEqual({
      ...incomingStateFromServer,
      title: {
        ...incomingStateFromServer.title,
        isModified: true,
      },
      array: {
        ...incomingStateFromServer.array,
        rows: currentState?.array?.rows,
      },
    })
  })

  it('should not accept values from the server if they have been modified locally since the request was made, e.g. `overrideLocalChanges: false` on autosave', () => {
    const title: FieldState = {
      value: 'Test Post (modified on the client 1)',
      initialValue: 'Test Post',
      valid: true,
      passesCondition: true,
    }

    const currentState: Record<string, FieldState> = {
      title: {
        ...title,
        isModified: true,
      },
      computedTitle: {
        value: 'Test Post',
        initialValue: 'Test Post',
        valid: true,
        passesCondition: true,
      },
    }

    const incomingStateFromServer: Record<string, FieldState> = {
      title: {
        value: 'Test Post (modified on the server)',
        initialValue: 'Test Post',
        valid: true,
        passesCondition: true,
      },
      computedTitle: {
        value: 'Test Post (modified on the server)',
        initialValue: 'Test Post',
        valid: true,
        passesCondition: true,
      },
    }

    const newState = mergeServerFormState({
      acceptValues: { overrideLocalChanges: false },
      currentState,
      incomingState: incomingStateFromServer,
    })

    expect(newState).toStrictEqual({
      ...currentState,
      title: {
        ...currentState.title,
        isModified: true,
      },
      computedTitle: incomingStateFromServer.computedTitle, // This field was not modified locally, so should be updated from the server
    })
  })

  it('should preserve client row data after reorder and delete during autosave', () => {
    /**
     * Regression test for the "ghost item" bug.
     * User reorders [A, B, C] → [C, A, B], autosave fires, then user deletes A.
     * Server responds with stale [C, A, B]. Client should preserve [C, B] and
     * not overwrite array.1 (B's data) with server's array.1 (A's data).
     */
    const currentState: FormState = {
      array: {
        value: 2,
        rows: [{ id: 'C' }, { id: 'B' }],
      },
      'array.0.text': { value: 'C text', initialValue: 'C text' },
      'array.1.text': { value: 'B text', initialValue: 'B text' },
    }

    const serverState: FormState = {
      array: {
        value: 3,
        rows: [{ id: 'C' }, { id: 'A' }, { id: 'B' }],
      },
      'array.0.text': { value: 'C text', initialValue: 'C text' },
      'array.1.text': { value: 'A text', initialValue: 'A text' },
      'array.2.text': { value: 'B text', initialValue: 'B text' },
    }

    const newState = mergeServerFormState({
      acceptValues: { overrideLocalChanges: false },
      currentState,
      incomingState: serverState,
    })

    expect(newState.array?.rows).toHaveLength(2)
    expect(newState.array?.rows?.[0]).toMatchObject({ id: 'C' })
    expect(newState.array?.rows?.[1]).toMatchObject({ id: 'B' })
    expect(newState.array?.value).toBe(2)
    expect(newState['array.0.text']?.value).toBe('C text')
    expect(newState['array.1.text']?.value).toBe('B text')
  })

  it('should preserve client row data after reorder during autosave', () => {
    /**
     * User reorders [A, B] → [B, A] during autosave.
     * Server responds with stale [A, B]. Field values should remain with correct rows.
     */
    const currentState: FormState = {
      array: {
        value: 2,
        rows: [{ id: 'B' }, { id: 'A' }],
      },
      'array.0.text': { value: 'B text', initialValue: 'B text' },
      'array.1.text': { value: 'A text', initialValue: 'A text' },
    }

    const serverState: FormState = {
      array: {
        value: 2,
        rows: [{ id: 'A' }, { id: 'B' }],
      },
      'array.0.text': { value: 'A text', initialValue: 'A text' },
      'array.1.text': { value: 'B text', initialValue: 'B text' },
    }

    const newState = mergeServerFormState({
      acceptValues: { overrideLocalChanges: false },
      currentState,
      incomingState: serverState,
    })

    expect(newState.array?.rows).toHaveLength(2)
    expect(newState.array?.rows?.[0]).toMatchObject({ id: 'B' })
    expect(newState.array?.rows?.[1]).toMatchObject({ id: 'A' })
    expect(newState['array.0.text']?.value).toBe('B text')
    expect(newState['array.1.text']?.value).toBe('A text')
  })

  it('should preserve nested array row data after reorder during autosave', () => {
    /**
     * User reorders nested array blocks[0].items from [A, B] → [B, A] during autosave.
     * Outer block unchanged. Server responds with stale inner array [A, B].
     * Field values should remain with correct rows at nested level.
     */
    const currentState: FormState = {
      blocks: {
        value: 1,
        rows: [{ id: 'block-1' }],
      },
      'blocks.0.items': {
        value: 2,
        rows: [{ id: 'B' }, { id: 'A' }],
      },
      'blocks.0.items.0.text': { value: 'B text', initialValue: 'B text' },
      'blocks.0.items.1.text': { value: 'A text', initialValue: 'A text' },
    }

    const serverState: FormState = {
      blocks: {
        value: 1,
        rows: [{ id: 'block-1' }],
      },
      'blocks.0.items': {
        value: 2,
        rows: [{ id: 'A' }, { id: 'B' }],
      },
      'blocks.0.items.0.text': { value: 'A text', initialValue: 'A text' },
      'blocks.0.items.1.text': { value: 'B text', initialValue: 'B text' },
    }

    const newState = mergeServerFormState({
      acceptValues: { overrideLocalChanges: false },
      currentState,
      incomingState: serverState,
    })

    expect(newState.blocks?.rows).toHaveLength(1)
    expect(newState.blocks?.rows?.[0]).toMatchObject({ id: 'block-1' })
    expect(newState['blocks.0.items']?.rows).toHaveLength(2)
    expect(newState['blocks.0.items']?.rows?.[0]).toMatchObject({ id: 'B' })
    expect(newState['blocks.0.items']?.rows?.[1]).toMatchObject({ id: 'A' })
    expect(newState['blocks.0.items.0.text']?.value).toBe('B text')
    expect(newState['blocks.0.items.1.text']?.value).toBe('A text')
  })

  it('should preserve nested array row data after reorder and delete during autosave', () => {
    /**
     * User reorders nested array blocks[0].items from [A, B, C] → [C, A, B], then deletes A.
     * Outer block unchanged. Server responds with stale inner array [C, A, B].
     * Client should preserve [C, B] and not overwrite with stale data.
     */
    const currentState: FormState = {
      blocks: {
        value: 1,
        rows: [{ id: 'block-1' }],
      },
      'blocks.0.items': {
        value: 2,
        rows: [{ id: 'C' }, { id: 'B' }],
      },
      'blocks.0.items.0.text': { value: 'C text', initialValue: 'C text' },
      'blocks.0.items.1.text': { value: 'B text', initialValue: 'B text' },
    }

    const serverState: FormState = {
      blocks: {
        value: 1,
        rows: [{ id: 'block-1' }],
      },
      'blocks.0.items': {
        value: 3,
        rows: [{ id: 'C' }, { id: 'A' }, { id: 'B' }],
      },
      'blocks.0.items.0.text': { value: 'C text', initialValue: 'C text' },
      'blocks.0.items.1.text': { value: 'A text', initialValue: 'A text' },
      'blocks.0.items.2.text': { value: 'B text', initialValue: 'B text' },
    }

    const newState = mergeServerFormState({
      acceptValues: { overrideLocalChanges: false },
      currentState,
      incomingState: serverState,
    })

    expect(newState.blocks?.rows).toHaveLength(1)
    expect(newState.blocks?.rows?.[0]).toMatchObject({ id: 'block-1' })
    expect(newState['blocks.0.items']?.rows).toHaveLength(2)
    expect(newState['blocks.0.items']?.rows?.[0]).toMatchObject({ id: 'C' })
    expect(newState['blocks.0.items']?.rows?.[1]).toMatchObject({ id: 'B' })
    expect(newState['blocks.0.items']?.value).toBe(2)
    expect(newState['blocks.0.items.0.text']?.value).toBe('C text')
    expect(newState['blocks.0.items.1.text']?.value).toBe('B text')
  })

  it('should accept server values on explicit save without row ID guard', () => {
    /**
     * On explicit save (acceptValues: true), server values should be accepted
     * without the row ID guard interfering. This test ensures the guard is
     * scoped to autosave only.
     *
     * Edge case: Client has [B, A], server responds with [A, B] (perhaps due to
     * server-side re-sorting). Without acceptValues !== true check, the guard
     * would see mismatched IDs and reject server values. With the check, server
     * values are accepted because explicit save responses are authoritative.
     */
    const currentState: FormState = {
      array: {
        value: 2,
        rows: [{ id: 'B' }, { id: 'A' }],
      },
      'array.0.text': { value: 'B text modified locally', initialValue: 'B text' },
      'array.1.text': { value: 'A text modified locally', initialValue: 'A text' },
    }

    const serverState: FormState = {
      array: {
        value: 2,
        rows: [{ id: 'A' }, { id: 'B' }],
      },
      'array.0.text': { value: 'A text from server', initialValue: 'A text' },
      'array.1.text': { value: 'B text from server', initialValue: 'B text' },
    }

    const newState = mergeServerFormState({
      acceptValues: true,
      currentState,
      incomingState: serverState,
    })

    expect(newState.array?.rows).toHaveLength(2)
    expect(newState.array?.rows?.[0]).toMatchObject({ id: 'A' })
    expect(newState.array?.rows?.[1]).toMatchObject({ id: 'B' })
    // Server values should be accepted even though row IDs don't match at same indexes
    expect(newState['array.0.text']?.value).toBe('A text from server')
    expect(newState['array.1.text']?.value).toBe('B text from server')
  })

  it('should preserve client-added row during autosave', () => {
    /**
     * Client adds row D during autosave. Server responds with stale [A, B, C].
     * Row D should be preserved with its client value.
     */
    const currentState: FormState = {
      array: {
        value: 4,
        rows: [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }],
      },
      'array.0.text': { value: 'A text', initialValue: 'A text' },
      'array.1.text': { value: 'B text', initialValue: 'B text' },
      'array.2.text': { value: 'C text', initialValue: 'C text' },
      'array.3.text': { value: 'D text', initialValue: 'D text' },
    }

    const serverState: FormState = {
      array: {
        value: 3,
        rows: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
      },
      'array.0.text': { value: 'A text', initialValue: 'A text' },
      'array.1.text': { value: 'B text', initialValue: 'B text' },
      'array.2.text': { value: 'C text', initialValue: 'C text' },
    }

    const newState = mergeServerFormState({
      acceptValues: { overrideLocalChanges: false },
      currentState,
      incomingState: serverState,
    })

    expect(newState.array?.rows).toHaveLength(4)
    expect(newState.array?.rows?.[3]).toMatchObject({ id: 'D' })
    expect(newState.array?.value).toBe(4)
    expect(newState['array.3.text']?.value).toBe('D text')
  })

  it('should append server-added row with addedByServer flag', () => {
    /**
     * Server adds a new row via hook with addedByServer: true.
     * Row should be appended and not blocked by row ID guard.
     */
    const currentState: FormState = {
      array: {
        value: 2,
        rows: [{ id: 'A' }, { id: 'B' }],
      },
      'array.0.text': { value: 'A text', initialValue: 'A text' },
      'array.1.text': { value: 'B text', initialValue: 'B text' },
    }

    const serverState: FormState = {
      array: {
        value: 3,
        rows: [{ id: 'A' }, { id: 'B' }, { id: 'C', addedByServer: true }],
      },
      'array.0.text': { value: 'A text', initialValue: 'A text' },
      'array.1.text': { value: 'B text', initialValue: 'B text' },
      'array.2.text': { value: 'C text', initialValue: 'C text', addedByServer: true },
    }

    const newState = mergeServerFormState({
      acceptValues: { overrideLocalChanges: false },
      currentState,
      incomingState: serverState,
    })

    expect(newState.array?.rows).toHaveLength(3)
    expect(newState.array?.rows?.[2]).toMatchObject({ id: 'C' })
    expect(newState.array?.rows?.[2]).not.toHaveProperty('addedByServer')
    expect(newState.array?.value).toBe(3)
    expect(newState['array.2.text']?.value).toBe('C text')
    expect(newState['array.2.text']).not.toHaveProperty('addedByServer')
  })

  it('should preserve empty client array when server has rows', () => {
    /**
     * Client deleted all rows during autosave. Server responds with [A, B].
     * Client should stay empty.
     */
    const currentState: FormState = {
      array: {
        value: 0,
        rows: [],
      },
    }

    const serverState: FormState = {
      array: {
        value: 2,
        rows: [{ id: 'A' }, { id: 'B' }],
      },
      'array.0.text': { value: 'A text', initialValue: 'A text' },
      'array.1.text': { value: 'B text', initialValue: 'B text' },
    }

    const newState = mergeServerFormState({
      acceptValues: { overrideLocalChanges: false },
      currentState,
      incomingState: serverState,
    })

    expect(newState.array?.rows).toHaveLength(0)
    expect(newState.array?.value).toBe(0)
    expect(newState['array.0.text']).toBeUndefined()
    expect(newState['array.1.text']).toBeUndefined()
  })

  it('should handle 3-level nested array reordering', () => {
    /**
     * Verify parseArrayFieldPath works at depth 3+.
     * blocks.0.items.1.subItems reordered from [X, Y] → [Y, X].
     */
    const currentState: FormState = {
      blocks: {
        value: 1,
        rows: [{ id: 'block-1' }],
      },
      'blocks.0.items': {
        value: 2,
        rows: [{ id: 'item-1' }, { id: 'item-2' }],
      },
      'blocks.0.items.1.subItems': {
        value: 2,
        rows: [{ id: 'Y' }, { id: 'X' }],
      },
      'blocks.0.items.1.subItems.0.text': { value: 'Y text', initialValue: 'Y text' },
      'blocks.0.items.1.subItems.1.text': { value: 'X text', initialValue: 'X text' },
    }

    const serverState: FormState = {
      blocks: {
        value: 1,
        rows: [{ id: 'block-1' }],
      },
      'blocks.0.items': {
        value: 2,
        rows: [{ id: 'item-1' }, { id: 'item-2' }],
      },
      'blocks.0.items.1.subItems': {
        value: 2,
        rows: [{ id: 'X' }, { id: 'Y' }],
      },
      'blocks.0.items.1.subItems.0.text': { value: 'X text', initialValue: 'X text' },
      'blocks.0.items.1.subItems.1.text': { value: 'Y text', initialValue: 'Y text' },
    }

    const newState = mergeServerFormState({
      acceptValues: { overrideLocalChanges: false },
      currentState,
      incomingState: serverState,
    })

    expect(newState['blocks.0.items.1.subItems']?.rows).toHaveLength(2)
    expect(newState['blocks.0.items.1.subItems']?.rows?.[0]).toMatchObject({ id: 'Y' })
    expect(newState['blocks.0.items.1.subItems']?.rows?.[1]).toMatchObject({ id: 'X' })
    expect(newState['blocks.0.items.1.subItems.0.text']?.value).toBe('Y text')
    expect(newState['blocks.0.items.1.subItems.1.text']?.value).toBe('X text')
  })

  it('should set rows to empty array for empty array fields', async () => {
    const req = await createLocalReq({ user }, payload)

    // Create a document with an empty array
    const postData = await payload.create({
      collection: postsSlug,
      data: {
        title: 'Test Post',
        array: [], // Empty array - this should result in rows: [] in form state
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

    expect(state.array).toBeDefined()
    expect(state?.array?.rows).toEqual([]) // should be [] not undefined
  })
})
