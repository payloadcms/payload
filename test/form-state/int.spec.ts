import type { FieldState, FormState, User } from 'payload'

import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import { createLocalReq, getAccessResults } from 'payload'
import React from 'react'
import { fileURLToPath } from 'url'
import { expect, vi } from 'vitest'

import { devUser } from '../credentials.js'
import { autosavePostsSlug } from './collections/Autosave/index.js'
import { conditionsSlug } from './collections/Conditions/index.js'
import { postsSlug } from './collections/Posts/index.js'

// eslint-disable-next-line payload/no-relative-monorepo-imports
import { renderDocumentHandler } from '../../packages/ui/src/views/Document/handleServerFunction.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports
import { mergeServerFormState } from '../../packages/ui/src/forms/Form/mergeServerFormState.js'
import { test } from '../__helpers/int/vitest.js'

let user: User

const { email, password } = devUser

const DummyReactComponent: React.ReactNode = {
  // @ts-expect-error - can ignore, needs to satisfy `typeof value.$$typeof === 'symbol'`
  type: 'div',
  $$typeof: Symbol.for('react.element'),
  key: null,
  props: {},
}

test.suite({ config: './config.ts', resetBetweenTests: false })('Form State', () => {
  test.beforeAll(async ({ restClientInstance: restClient }) => {
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

  test.afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('should respect field create access when initializing an autosave draft', async ({
    payload,
  }) => {
    const editor = await payload.create({
      collection: 'users',
      data: {
        email: 'editor@example.com',
        password: 'test-password',
      },
      overrideAccess: true,
    })

    const req = await createLocalReq({ user: editor }, payload)
    const permissions = await getAccessResults({ req })
    const restrictedValue = 'client supplied'
    const title = 'Access filtered autosave'
    vi.stubGlobal('React', React)

    await renderDocumentHandler({
      collectionSlug: autosavePostsSlug,
      cookies: new Map(),
      docID: undefined as never,
      importMap: payload.importMap,
      initialData: {
        restrictedValue,
        title,
      },
      locale: undefined,
      permissions,
      redirectAfterCreate: false,
      redirectAfterDelete: false,
      redirectAfterDuplicate: false,
      req,
    })

    const { docs } = await payload.find({
      collection: autosavePostsSlug,
      draft: true,
      overrideAccess: true,
      where: {
        title: {
          equals: title,
        },
      },
    })

    expect(docs).toHaveLength(1)
    expect(docs[0]).not.toHaveProperty('restrictedValue', restrictedValue)
  })

  test('should build entire form state', async ({ payload }) => {
    const req = await createLocalReq({ user }, payload)

    const postData = await payload.create({
      collection: postsSlug,
      data: {
        title: 'Test Post',
      },
      overrideAccess: true,
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
      mockRSCs: true,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: postsSlug,
    })

    expect(state).toMatchObject({
      blocks: {
        initialValue: 0,
        rows: [],
        value: 0,
      },
      createdAt: {
        initialValue: postData.createdAt,
        value: postData.createdAt,
      },
      renderTracker: {},
      title: {
        initialValue: postData.title,
        value: postData.title,
      },
      updatedAt: {
        initialValue: postData.updatedAt,
        value: postData.updatedAt,
      },
      validateUsingEvent: {},
    })
  })

  test('should use `select` to build partial form state with only specified fields', async ({
    payload,
  }) => {
    const req = await createLocalReq({ user }, payload)

    const postData = await payload.create({
      collection: postsSlug,
      data: {
        title: 'Test Post',
      },
      overrideAccess: true,
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
      mockRSCs: true,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: postsSlug,
      select: {
        title: true,
      },
    })

    expect(state).toStrictEqual({
      '_index-7': {
        disableFormData: true,
      },
      '_index-7-0-0': {
        disableFormData: true,
      },
      title: {
        addedByServer: true,
        initialValue: postData.title,
        lastRenderedPath: 'title',
        value: postData.title,
      },
    })
  })

  test('should not render custom components when `lastRenderedPath` exists', async ({
    payload,
  }) => {
    const req = await createLocalReq({ user }, payload)

    const { state: stateWithRow } = await buildFormState({
      collectionSlug: postsSlug,
      docPermissions: undefined,
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      formState: {
        array: {
          rows: [
            {
              id: '123',
            },
          ],
        },
        'array.0.id': {
          initialValue: '123',
          value: '123',
        },
      },
      mockRSCs: true,
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
      collectionSlug: postsSlug,
      docPermissions: undefined,
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
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
        'array.0.customTextField': {
          lastRenderedPath: 'array.0.customTextField',
        },
        'array.0.id': {
          initialValue: '123',
          value: '123',
        },
        'array.1.id': {
          initialValue: '456',
          value: '456',
        },
      },
      mockRSCs: true,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: postsSlug,
    })

    // Ensure that row 1 _DOES NOT_ return with rendered components
    expect(stateWithTitle?.['array.0.customTextField']).toHaveProperty('lastRenderedPath')
    expect(stateWithTitle?.['array.0.customTextField']).not.toHaveProperty('customComponents')

    // Ensure that row 2 _DOES_ return with rendered components
    expect(stateWithTitle?.['array.1.customTextField']).toHaveProperty('lastRenderedPath')
    expect(stateWithTitle?.['array.1.customTextField']).toHaveProperty('customComponents')
    expect(stateWithTitle?.['array.1.customTextField']?.customComponents?.Field).toBeDefined()
  })

  test('should not render custom Field components for fields hidden by admin.condition', async ({
    payload,
  }) => {
    const req = await createLocalReq({ user }, payload)

    const hiddenDoc = await payload.create({
      collection: conditionsSlug,
      data: {
        showField: false,
      },
      overrideAccess: true,
    })

    const { state: stateHidden } = await buildFormState({
      id: hiddenDoc.id,
      collectionSlug: conditionsSlug,
      data: hiddenDoc,
      docPermissions: undefined,
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      mockRSCs: true,
      operation: 'update',
      renderAllFields: true,
      req,
      schemaPath: conditionsSlug,
    })

    expect(stateHidden?.conditionalCustomField).toBeDefined()
    expect(stateHidden?.conditionalCustomField?.passesCondition).toBe(false)
    expect(stateHidden?.conditionalCustomField).not.toHaveProperty('customComponents')
    expect(stateHidden?.conditionalCustomField?.lastRenderedPath).toBeUndefined()

    const visibleDoc = await payload.create({
      collection: conditionsSlug,
      data: {
        showField: true,
      },
      overrideAccess: true,
    })

    const { state: stateVisible } = await buildFormState({
      id: visibleDoc.id,
      collectionSlug: conditionsSlug,
      data: visibleDoc,
      docPermissions: undefined,
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      mockRSCs: true,
      operation: 'update',
      renderAllFields: true,
      req,
      schemaPath: conditionsSlug,
    })

    expect(stateVisible?.conditionalCustomField?.passesCondition).not.toBe(false)
    expect(stateVisible?.conditionalCustomField).toHaveProperty('customComponents')
    expect(stateVisible?.conditionalCustomField?.customComponents?.Field).toBeDefined()

    await payload.delete({ id: hiddenDoc.id, collection: conditionsSlug, overrideAccess: true })
    await payload.delete({ id: visibleDoc.id, collection: conditionsSlug, overrideAccess: true })
  })

  test('should preserve values of fields nested inside a row hidden by admin.condition', async ({
    payload,
  }) => {
    const req = await createLocalReq({ user }, payload)

    const hiddenDoc = await payload.create({
      collection: conditionsSlug,
      data: {
        conditionalRowField: 'value in db',
        showField: false,
      },
      overrideAccess: true,
    })

    const { state: stateHidden } = await buildFormState({
      id: hiddenDoc.id,
      collectionSlug: conditionsSlug,
      data: hiddenDoc,
      docPermissions: undefined,
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      mockRSCs: true,
      operation: 'update',
      renderAllFields: true,
      req,
      schemaPath: conditionsSlug,
    })

    expect(stateHidden?.conditionalRowField).toBeDefined()
    expect(stateHidden?.conditionalRowField?.value).toBe('value in db')

    // The row itself must still carry `passesCondition: false` so the client hides it via
    // `withCondition` (rather than rendering an empty, visible row).
    expect(stateHidden?.['_index-2']?.passesCondition).toBe(false)

    await payload.delete({ id: hiddenDoc.id, collection: conditionsSlug, overrideAccess: true })
  })

  test('should preserve values of fields nested inside a collapsible hidden by admin.condition', async ({
    payload,
  }) => {
    const req = await createLocalReq({ user }, payload)

    const hiddenDoc = await payload.create({
      collection: conditionsSlug,
      data: {
        conditionalCollapsibleField: 'collapsible db value',
        showField: false,
      },
      overrideAccess: true,
    })

    const { state: stateHidden } = await buildFormState({
      id: hiddenDoc.id,
      collectionSlug: conditionsSlug,
      data: hiddenDoc,
      docPermissions: undefined,
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      mockRSCs: true,
      operation: 'update',
      renderAllFields: true,
      req,
      schemaPath: conditionsSlug,
    })

    // Same regression class as `row`: a collapsible is a presentational container, so its
    // nested field's value must survive even though the collapsible is hidden.
    expect(stateHidden?.conditionalCollapsibleField?.value).toBe('collapsible db value')

    await payload.delete({ id: hiddenDoc.id, collection: conditionsSlug, overrideAccess: true })
  })

  test('should render custom Field component when admin.condition flips from false to true via onChange', async ({
    payload,
  }) => {
    const req = await createLocalReq({ user }, payload)

    const doc = await payload.create({
      collection: conditionsSlug,
      data: {
        showField: false,
      },
      overrideAccess: true,
    })

    const { state: initialState } = await buildFormState({
      id: doc.id,
      collectionSlug: conditionsSlug,
      data: doc,
      docPermissions: undefined,
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      mockRSCs: true,
      operation: 'update',
      renderAllFields: true,
      req,
      schemaPath: conditionsSlug,
    })

    expect(initialState?.conditionalCustomField).not.toHaveProperty('customComponents')

    // Simulate condition flipping true (user toggles checkbox) by re-requesting
    // form state with `renderAllFields: false` and updated value — same flow as onChange.
    initialState.showField!.value = true

    const { state: flippedState } = await buildFormState({
      id: doc.id,
      collectionSlug: conditionsSlug,
      docPermissions: undefined,
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      formState: initialState,
      mockRSCs: true,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: conditionsSlug,
    })

    expect(flippedState?.conditionalCustomField?.passesCondition).not.toBe(false)
    expect(flippedState?.conditionalCustomField).toHaveProperty('customComponents')
    expect(flippedState?.conditionalCustomField?.customComponents?.Field).toBeDefined()

    await payload.delete({ id: doc.id, collection: conditionsSlug, overrideAccess: true })
  })

  test('should add `addedByServer` flag to fields that originate on the server', async ({
    payload,
  }) => {
    const req = await createLocalReq({ user }, payload)

    const postData = await payload.create({
      collection: postsSlug,
      data: {
        blocks: [
          {
            blockType: 'text',
            text: 'Test block',
          },
        ],
        title: 'Test Post',
      },
      overrideAccess: true,
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
      mockRSCs: true,
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

  test('should not omit value and initialValue from fields added by the server', () => {
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
      'array.0.customTextField': {
        addedByServer: true,
        initialValue: 'Test',
        value: 'Test',
      },
      'array.0.id': {
        initialValue: '1',
        value: '1',
      },
    }

    const newState = mergeServerFormState({
      currentState,
      incomingState: serverState,
    })

    expect(newState['array.0.customTextField']).toStrictEqual({
      initialValue: 'Test',
      passesCondition: true,
      valid: true,
      value: 'Test',
    })
  })

  test('should merge array rows without losing rows added to local state', () => {
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
        initialValue: '1',
        value: '1',
      },
      'array.1.id': {
        initialValue: '2',
        value: '2',
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
      'array.0.customTextField': {
        addedByServer: true,
        initialValue: 'Test',
        value: 'Test',
      },
      'array.0.id': {
        initialValue: '1',
        value: '1',
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
        valid: true,
      },
      'array.0.customTextField': {
        initialValue: 'Test',
        passesCondition: true,
        valid: true,
        value: 'Test',
      },
      'array.0.id': {
        initialValue: '1',
        passesCondition: true,
        valid: true,
        value: '1',
      },
      'array.1.id': {
        initialValue: '2',
        value: '2',
      },
    })
  })

  test('should merge array rows without bringing back rows deleted from local state', () => {
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
        initialValue: '1',
        value: '1',
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
      'array.0.customTextField': {
        addedByServer: true,
        initialValue: 'Test',
        value: 'Test',
      },
      'array.0.id': {
        initialValue: '1',
        value: '1',
      },
      'array.1.customTextField': {
        initialValue: 'Test',
        value: 'Test',
      },
      'array.1.id': {
        initialValue: '2',
        value: '2',
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
        rows: [
          {
            id: '1',
            lastRenderedPath: 'array.0.customTextField',
          },
        ],
        valid: true,
      },
      'array.0.customTextField': {
        initialValue: 'Test',
        passesCondition: true,
        valid: true,
        value: 'Test',
      },
      'array.0.id': {
        initialValue: '1',
        passesCondition: true,
        valid: true,
        value: '1',
      },
    })
  })

  test('should merge new fields returned from the server that do not yet exist in local state', () => {
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
        initialValue: '1',
        value: '1',
      },
    }

    const serverState: FormState = {
      array: {
        rows: [
          {
            id: '1',
            isLoading: false,
            lastRenderedPath: 'array.0.customTextField',
          },
        ],
      },
      'array.0.customTextField': {
        addedByServer: true,
        initialValue: 'Test',
        value: 'Test',
      },
      'array.0.id': {
        initialValue: '1',
        value: '1',
      },
    }

    const newState = mergeServerFormState({
      currentState,
      incomingState: serverState,
    })

    expect(newState).toStrictEqual({
      array: {
        passesCondition: true,
        rows: [
          {
            id: '1',
            isLoading: false,
            lastRenderedPath: 'array.0.customTextField',
          },
        ],
        valid: true,
      },
      'array.0.customTextField': {
        initialValue: 'Test',
        passesCondition: true,
        valid: true,
        value: 'Test',
      },
      'array.0.id': {
        initialValue: '1',
        passesCondition: true,
        valid: true,
        value: '1',
      },
    })
  })

  test('should return the same object reference when only modifying a value', () => {
    const currentState = {
      title: {
        initialValue: 'Test Post',
        passesCondition: true,
        valid: true,
        value: 'Test Post',
      },
    }

    const newState = mergeServerFormState({
      currentState,
      incomingState: {
        title: {
          initialValue: 'Test Post',
          passesCondition: true,
          valid: true,
          value: 'Test Post (modified)',
        },
      },
    })

    expect(newState === currentState).toBe(true)
  })

  test('should accept all values from the server regardless of local modifications, e.g. `acceptAllValues` on submit', () => {
    const title: FieldState = {
      initialValue: 'Test Post',
      passesCondition: true,
      valid: true,
      value: 'Test Post (modified on the client)',
    }

    const currentState: Record<string, FieldState> = {
      array: {
        passesCondition: true,
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
      },
      'array.0.customTextField': {
        initialValue: 'Test Post',
        passesCondition: true,
        valid: true,
        value: 'Test Post (modified on the client)',
      },
      'array.0.id': {
        initialValue: '1',
        passesCondition: true,
        valid: true,
        value: '1',
      },
      computedTitle: {
        initialValue: 'Test Post',
        passesCondition: true,
        valid: true,
        value: 'Test Post (computed on the client)',
      },
      title: {
        ...title,
        isModified: true, // This is critical, this is what we're testing
      },
    }

    const incomingStateFromServer: Record<string, FieldState> = {
      array: {
        passesCondition: true,
        rows: [
          {
            id: '1',
            lastRenderedPath: 'array.0.customTextField',
            // Omit `customComponents` because the server did not re-render this row
          },
        ],
        valid: true,
      },
      'array.0.customTextField': {
        initialValue: 'Test Post',
        passesCondition: true,
        valid: true,
        value: 'Test Post (modified on the client)',
      },
      'array.0.id': {
        initialValue: '1',
        passesCondition: true,
        valid: true,
        value: '1',
      },
      computedTitle: {
        initialValue: 'Test Post',
        passesCondition: true,
        valid: true,
        value: 'Test Post (computed on the server)',
      },
      title: {
        initialValue: 'Test Post',
        passesCondition: true,
        valid: true,
        value: 'Test Post (modified on the server)',
      },
    }

    const newState = mergeServerFormState({
      acceptValues: true,
      currentState,
      incomingState: incomingStateFromServer,
    })

    expect(newState).toStrictEqual({
      ...incomingStateFromServer,
      array: {
        ...incomingStateFromServer.array,
        rows: currentState?.array?.rows,
      },
      title: {
        ...incomingStateFromServer.title,
        isModified: true,
      },
    })
  })

  test('should not accept values from the server if they have been modified locally since the request was made, e.g. `overrideLocalChanges: false` on autosave', () => {
    const title: FieldState = {
      initialValue: 'Test Post',
      passesCondition: true,
      valid: true,
      value: 'Test Post (modified on the client 1)',
    }

    const currentState: Record<string, FieldState> = {
      computedTitle: {
        initialValue: 'Test Post',
        passesCondition: true,
        valid: true,
        value: 'Test Post',
      },
      title: {
        ...title,
        isModified: true,
      },
    }

    const incomingStateFromServer: Record<string, FieldState> = {
      computedTitle: {
        initialValue: 'Test Post',
        passesCondition: true,
        valid: true,
        value: 'Test Post (modified on the server)',
      },
      title: {
        initialValue: 'Test Post',
        passesCondition: true,
        valid: true,
        value: 'Test Post (modified on the server)',
      },
    }

    const newState = mergeServerFormState({
      acceptValues: { overrideLocalChanges: false },
      currentState,
      incomingState: incomingStateFromServer,
    })

    expect(newState).toStrictEqual({
      ...currentState,
      computedTitle: incomingStateFromServer.computedTitle, // This field was not modified locally, so should be updated from the server
      title: {
        ...currentState.title,
        isModified: true,
      },
    })
  })

  test('should preserve client row data after reorder and delete during autosave', () => {
    /**
     * Regression test for the "ghost item" bug.
     * User reorders [A, B, C] → [C, A, B], autosave fires, then user deletes A.
     * Server responds with stale [C, A, B]. Client should preserve [C, B] and
     * not overwrite array.1 (B's data) with server's array.1 (A's data).
     */
    const currentState: FormState = {
      array: {
        rows: [{ id: 'C' }, { id: 'B' }],
        value: 2,
      },
      'array.0.text': { initialValue: 'C text', value: 'C text' },
      'array.1.text': { initialValue: 'B text', value: 'B text' },
    }

    const serverState: FormState = {
      array: {
        rows: [{ id: 'C' }, { id: 'A' }, { id: 'B' }],
        value: 3,
      },
      'array.0.text': { initialValue: 'C text', value: 'C text' },
      'array.1.text': { initialValue: 'A text', value: 'A text' },
      'array.2.text': { initialValue: 'B text', value: 'B text' },
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

  test('should preserve client row data after reorder during autosave', () => {
    /**
     * User reorders [A, B] → [B, A] during autosave.
     * Server responds with stale [A, B]. Field values should remain with correct rows.
     */
    const currentState: FormState = {
      array: {
        rows: [{ id: 'B' }, { id: 'A' }],
        value: 2,
      },
      'array.0.text': { initialValue: 'B text', value: 'B text' },
      'array.1.text': { initialValue: 'A text', value: 'A text' },
    }

    const serverState: FormState = {
      array: {
        rows: [{ id: 'A' }, { id: 'B' }],
        value: 2,
      },
      'array.0.text': { initialValue: 'A text', value: 'A text' },
      'array.1.text': { initialValue: 'B text', value: 'B text' },
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

  test('should preserve nested array row data after reorder during autosave', () => {
    /**
     * User reorders nested array blocks[0].items from [A, B] → [B, A] during autosave.
     * Outer block unchanged. Server responds with stale inner array [A, B].
     * Field values should remain with correct rows at nested level.
     */
    const currentState: FormState = {
      blocks: {
        rows: [{ id: 'block-1' }],
        value: 1,
      },
      'blocks.0.items': {
        rows: [{ id: 'B' }, { id: 'A' }],
        value: 2,
      },
      'blocks.0.items.0.text': { initialValue: 'B text', value: 'B text' },
      'blocks.0.items.1.text': { initialValue: 'A text', value: 'A text' },
    }

    const serverState: FormState = {
      blocks: {
        rows: [{ id: 'block-1' }],
        value: 1,
      },
      'blocks.0.items': {
        rows: [{ id: 'A' }, { id: 'B' }],
        value: 2,
      },
      'blocks.0.items.0.text': { initialValue: 'A text', value: 'A text' },
      'blocks.0.items.1.text': { initialValue: 'B text', value: 'B text' },
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

  test('should preserve nested array row data after reorder and delete during autosave', () => {
    /**
     * User reorders nested array blocks[0].items from [A, B, C] → [C, A, B], then deletes A.
     * Outer block unchanged. Server responds with stale inner array [C, A, B].
     * Client should preserve [C, B] and not overwrite with stale data.
     */
    const currentState: FormState = {
      blocks: {
        rows: [{ id: 'block-1' }],
        value: 1,
      },
      'blocks.0.items': {
        rows: [{ id: 'C' }, { id: 'B' }],
        value: 2,
      },
      'blocks.0.items.0.text': { initialValue: 'C text', value: 'C text' },
      'blocks.0.items.1.text': { initialValue: 'B text', value: 'B text' },
    }

    const serverState: FormState = {
      blocks: {
        rows: [{ id: 'block-1' }],
        value: 1,
      },
      'blocks.0.items': {
        rows: [{ id: 'C' }, { id: 'A' }, { id: 'B' }],
        value: 3,
      },
      'blocks.0.items.0.text': { initialValue: 'C text', value: 'C text' },
      'blocks.0.items.1.text': { initialValue: 'A text', value: 'A text' },
      'blocks.0.items.2.text': { initialValue: 'B text', value: 'B text' },
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

  test('should accept server values on explicit save without row ID guard', () => {
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
        rows: [{ id: 'B' }, { id: 'A' }],
        value: 2,
      },
      'array.0.text': { initialValue: 'B text', value: 'B text modified locally' },
      'array.1.text': { initialValue: 'A text', value: 'A text modified locally' },
    }

    const serverState: FormState = {
      array: {
        rows: [{ id: 'A' }, { id: 'B' }],
        value: 2,
      },
      'array.0.text': { initialValue: 'A text', value: 'A text from server' },
      'array.1.text': { initialValue: 'B text', value: 'B text from server' },
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

  test('should preserve client-added row during autosave', () => {
    /**
     * Client adds row D during autosave. Server responds with stale [A, B, C].
     * Row D should be preserved with its client value.
     */
    const currentState: FormState = {
      array: {
        rows: [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }],
        value: 4,
      },
      'array.0.text': { initialValue: 'A text', value: 'A text' },
      'array.1.text': { initialValue: 'B text', value: 'B text' },
      'array.2.text': { initialValue: 'C text', value: 'C text' },
      'array.3.text': { initialValue: 'D text', value: 'D text' },
    }

    const serverState: FormState = {
      array: {
        rows: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
        value: 3,
      },
      'array.0.text': { initialValue: 'A text', value: 'A text' },
      'array.1.text': { initialValue: 'B text', value: 'B text' },
      'array.2.text': { initialValue: 'C text', value: 'C text' },
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

  test('should append server-added row with addedByServer flag', () => {
    /**
     * Server adds a new row via hook with addedByServer: true.
     * Row should be appended and not blocked by row ID guard.
     */
    const currentState: FormState = {
      array: {
        rows: [{ id: 'A' }, { id: 'B' }],
        value: 2,
      },
      'array.0.text': { initialValue: 'A text', value: 'A text' },
      'array.1.text': { initialValue: 'B text', value: 'B text' },
    }

    const serverState: FormState = {
      array: {
        rows: [{ id: 'A' }, { id: 'B' }, { id: 'C', addedByServer: true }],
        value: 3,
      },
      'array.0.text': { initialValue: 'A text', value: 'A text' },
      'array.1.text': { initialValue: 'B text', value: 'B text' },
      'array.2.text': { addedByServer: true, initialValue: 'C text', value: 'C text' },
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

  test('should preserve empty client array when server has rows', () => {
    /**
     * Client deleted all rows during autosave. Server responds with [A, B].
     * Client should stay empty.
     */
    const currentState: FormState = {
      array: {
        rows: [],
        value: 0,
      },
    }

    const serverState: FormState = {
      array: {
        rows: [{ id: 'A' }, { id: 'B' }],
        value: 2,
      },
      'array.0.text': { initialValue: 'A text', value: 'A text' },
      'array.1.text': { initialValue: 'B text', value: 'B text' },
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

  test('should handle 3-level nested array reordering', () => {
    /**
     * Verify parseArrayFieldPath works at depth 3+.
     * blocks.0.items.1.subItems reordered from [X, Y] → [Y, X].
     */
    const currentState: FormState = {
      blocks: {
        rows: [{ id: 'block-1' }],
        value: 1,
      },
      'blocks.0.items': {
        rows: [{ id: 'item-1' }, { id: 'item-2' }],
        value: 2,
      },
      'blocks.0.items.1.subItems': {
        rows: [{ id: 'Y' }, { id: 'X' }],
        value: 2,
      },
      'blocks.0.items.1.subItems.0.text': { initialValue: 'Y text', value: 'Y text' },
      'blocks.0.items.1.subItems.1.text': { initialValue: 'X text', value: 'X text' },
    }

    const serverState: FormState = {
      blocks: {
        rows: [{ id: 'block-1' }],
        value: 1,
      },
      'blocks.0.items': {
        rows: [{ id: 'item-1' }, { id: 'item-2' }],
        value: 2,
      },
      'blocks.0.items.1.subItems': {
        rows: [{ id: 'X' }, { id: 'Y' }],
        value: 2,
      },
      'blocks.0.items.1.subItems.0.text': { initialValue: 'X text', value: 'X text' },
      'blocks.0.items.1.subItems.1.text': { initialValue: 'Y text', value: 'Y text' },
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

  test('should set rows to empty array for empty array fields', async ({ payload }) => {
    const req = await createLocalReq({ user }, payload)

    // Create a document with an empty array
    const postData = await payload.create({
      collection: postsSlug,
      data: {
        array: [], // Empty array - this should result in rows: [] in form state
        title: 'Test Post',
      },
      overrideAccess: true,
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
      mockRSCs: true,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: postsSlug,
    })

    expect(state.array).toBeDefined()
    expect(state?.array?.rows).toEqual([]) // should be [] not undefined
  })

  test('should resolve a promise-returning `filterOptions` on a select field into `selectFilterOptions`', async ({
    payload,
  }) => {
    const req = await createLocalReq({ user }, payload)

    const postData = await payload.create({
      collection: postsSlug,
      data: {
        title: 'Test Post',
      },
      overrideAccess: true,
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
      mockRSCs: true,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: postsSlug,
    })

    expect(state.selectWithAsyncFilterOptions?.selectFilterOptions).toStrictEqual(['allowed'])

    await payload.delete({ id: postData.id, collection: postsSlug, overrideAccess: true })
  })
})
