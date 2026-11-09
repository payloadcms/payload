// @vitest-environment jsdom
import type { FormState } from 'payload'

import { getDataFromFormState } from 'payload/shared'
import React, { act, useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FormProps, Context as FormContext } from './types.js'
import type { UseFormStateResult } from './useFormState.js'

import { useQueue } from '../../hooks/useQueue.js'
import { LivePreviewContext } from '../../providers/LivePreview/context.js'
import { useFormState } from './useFormState.js'

const mocks = vi.hoisted(() => ({
  document: {
    id: 'document-1',
    collectionSlug: 'posts',
    data: { updatedAt: '2026-11-09T12:00:00.000Z' },
    docConfig: { lockDocuments: false },
    docPermissions: { fields: true },
    getDocPermissions: vi.fn(async () => ({ fields: true })),
    getDocPreferences: vi.fn(async () => ({ fields: {} })),
  },
  getFormState: vi.fn(),
}))

vi.mock('../../providers/Auth/index.js', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }))
vi.mock('../../providers/Config/index.js', () => ({ useConfig: () => ({ config: {} }) }))
vi.mock('../../providers/DocumentInfo/index.js', () => ({ useDocumentInfo: () => mocks.document }))
vi.mock('../../providers/Operation/index.js', () => ({ useOperation: () => 'update' }))
vi.mock('../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ getFormState: mocks.getFormState }),
}))
vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('./context.js', () => ({ useDocumentForm: () => ({}) }))

type Response = { livePreviewURL?: string; previewURL?: string; state: FormState | null }
type Request = {
  args: { formState: FormState; select?: FormProps['select']; signal: AbortSignal }
  resolve: (response: Response) => void
}

const requests: Request[] = []
const cleanups: Array<() => void> = []

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.clearAllMocks()
  requests.length = 0
  mocks.getFormState.mockImplementation(
    (args: Request['args']) =>
      new Promise<Response>((resolve) => {
        requests.push({ args, resolve })
      }),
  )
})

afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) {
    act(cleanup)
  }

  await act(async () => {
    for (const request of requests) {
      request.resolve({ state: createState({ title: 'Cleanup' }) })
    }
  })

  vi.unstubAllGlobals()
})

describe('form-state request priority', () => {
  it('should complete local validation before a pending edit refresh', async () => {
    const fixture = renderFormState()
    const validation = fixture.current.validateForm({ isLocalSubmission: true })
    const outcome = validation.then(
      (result) => ({ result }),
      (error: Error) => ({ error }),
    )

    await act(async () => {})

    expect(requests).toHaveLength(1)

    await act(async () => {
      fixture.current.refreshFormState()
    })

    expect(requests[0].args.signal.aborted).toBe(false)
    expect(requests).toHaveLength(1)

    await act(async () => {
      requests[0].resolve({ state: createState({ title: 'Validated title' }) })
      await outcome
    })

    expect(await outcome).toMatchObject({
      result: { data: { title: 'Validated title' }, isValid: true },
    })
    expect(requests).toHaveLength(2)
    expect(requests[1].args.formState.title.value).toBe('Validated title')

    await act(async () => {
      requests[1].resolve({ state: createState({ title: 'Validated title' }) })
    })
  })

  it('should refresh the saved fields after a pending post-save request completes', async () => {
    const fixture = renderFormState({ isDocumentForm: true })
    const afterSave = fixture.current.refreshFormStateAfterSave({
      acceptValues: true,
      savedDocument: { title: 'Saved title', updatedAt: '2026-11-09T12:01:00.000Z' },
    })

    await act(async () => {})

    await act(async () => {
      fixture.current.refreshFormState()
    })

    expect(requests).toHaveLength(1)
    expect(requests[0].args.signal.aborted).toBe(false)

    await act(async () => {
      requests[0].resolve({ state: createState({ title: 'Saved title' }) })
      await afterSave
    })

    expect(fixture.current.formState.title.value).toBe('Saved title')
    expect(requests).toHaveLength(2)
    expect(requests[1].args.formState.title.value).toBe('Saved title')

    await act(async () => {
      requests[1].resolve({ state: createState({ title: 'Saved title' }) })
    })
  })

  it('should finish post-save preview updates before refreshing newer local edits', async () => {
    const fixture = renderFormState({ isDocumentForm: true })
    const afterSave = fixture.current.refreshFormStateAfterSave({
      acceptValues: { overrideLocalChanges: false },
      savedDocument: { title: 'Saved title', updatedAt: '2026-11-09T12:01:00.000Z' },
    })

    await act(async () => {})

    expect(requests).toHaveLength(1)

    await act(async () => {
      fixture.current.dispatchFields({ type: 'UPDATE', path: 'title', value: 'New local title' })
      fixture.current.refreshFormState()
    })

    expect(requests[0].args.signal.aborted).toBe(false)
    expect(requests).toHaveLength(1)

    await act(async () => {
      requests[0].resolve({
        livePreviewURL: '/live/saved',
        previewURL: '/preview/saved',
        state: createState({ title: 'Saved title' }),
      })
      await afterSave
    })

    expect(fixture.current.formState.title.value).toBe('New local title')
    expect(fixture.setURL).toHaveBeenCalledExactlyOnceWith('/live/saved')
    expect(fixture.setPreviewURL).toHaveBeenCalledExactlyOnceWith('/preview/saved')
    expect(requests).toHaveLength(2)
    expect(requests[1].args.formState.title.value).toBe('New local title')

    await act(async () => {
      requests[1].resolve({ state: createState({ title: 'Saved title' }) })
    })
  })

  it('should cancel local validation when the selected fields change', async () => {
    const fixture = renderFormState()
    const outcome = fixture.current
      .validateForm({ isLocalSubmission: true })
      .catch((error) => error)

    await act(async () => {})

    await act(async () => {
      fixture.current.refreshFormState()
    })

    expect(requests).toHaveLength(1)

    fixture.render({ select: { title: true } })

    await act(async () => {})

    expect(requests[0].args.signal.aborted).toBe(true)
    expect(requests).toHaveLength(2)
    expect(requests[1].args.select).toEqual({ title: true })

    await act(async () => {
      requests[0].resolve({ state: createState({ title: 'Obsolete title' }) })
      await outcome
    })

    expect(await outcome).toEqual(new Error('error:unspecific'))
    expect(fixture.onApplied).not.toHaveBeenCalled()
    expect(fixture.current.formState.title.value).toBe('Initial title')
    expect(requests).toHaveLength(2)
    expect(requests[1].args.select).toEqual({ title: true })

    await act(async () => {
      requests[1].resolve({ state: createState({ title: 'Initial title' }) })
    })

    expect(requests).toHaveLength(2)
    expect(fixture.onApplied).toHaveBeenCalledOnce()
  })

  it('should cancel local validation without applying its response after unmount', async () => {
    const fixture = renderFormState()
    const outcome = fixture.current
      .validateForm({ isLocalSubmission: true })
      .catch((error) => error)

    await act(async () => {})

    await act(async () => {
      fixture.current.refreshFormState()
    })

    expect(requests).toHaveLength(1)

    fixture.unmount()

    expect(requests[0].args.signal.aborted).toBe(true)

    await act(async () => {
      requests[0].resolve({ state: createState({ title: 'Obsolete title' }) })
      await outcome
    })

    expect(await outcome).toEqual(new Error('error:unspecific'))
    expect(fixture.onApplied).not.toHaveBeenCalled()
    expect(requests).toHaveLength(1)
  })

  it('should release a pending edit refresh when local validation fails', async () => {
    const fixture = renderFormState()
    const outcome = fixture.current
      .validateForm({ isLocalSubmission: true })
      .catch((error) => error)

    await act(async () => {})

    await act(async () => {
      fixture.current.refreshFormState()
    })

    expect(requests).toHaveLength(1)

    await act(async () => {
      requests[0].resolve({ state: null })
      await outcome
    })

    expect(await outcome).toEqual(new Error('error:unspecific'))
    expect(requests).toHaveLength(2)

    await act(async () => {
      requests[1].resolve({ state: createState({ title: 'Initial title' }) })
    })

    expect(fixture.onApplied).toHaveBeenCalledOnce()
  })

  it('should let validation supersede an older edit refresh without applying its response', async () => {
    const fixture = renderFormState()

    await act(async () => {
      fixture.current.refreshFormState()
    })

    const validation = fixture.current.validateForm({ isLocalSubmission: true })
    const outcome = validation.then(
      (result) => ({ result }),
      (error: Error) => ({ error }),
    )

    await act(async () => {})

    expect(requests).toHaveLength(2)
    expect(requests[0].args.signal.aborted).toBe(true)
    expect(requests[1].args.signal.aborted).toBe(false)

    await act(async () => {
      requests[1].resolve({ state: createState({ title: 'Validated title' }) })
      await outcome
    })

    expect(await outcome).toMatchObject({ result: { isValid: true } })

    await act(async () => {
      requests[0].resolve({
        state: { title: { errorMessage: 'Obsolete error', valid: false, value: 'Obsolete title' } },
      })
    })

    expect(fixture.current.formState.title).toMatchObject({ valid: true, value: 'Validated title' })
    expect(fixture.current.formState.title.errorMessage).toBeUndefined()
    expect(fixture.onApplied).toHaveBeenCalledOnce()
  })
})

function renderFormState({ isDocumentForm = false }: { isDocumentForm?: boolean } = {}) {
  const root = createRoot(document.createElement('div'))
  const onApplied = vi.fn()
  const setURL = vi.fn()
  const setPreviewURL = vi.fn()
  const initialState = createState({ title: 'Initial title' })
  let current: UseFormStateResult
  let isUnmounted = false

  function Fixture({ select }: { select?: FormProps['select'] }) {
    const contextRef = useRef({} as FormContext)
    const submissionActivityRef = useRef({ running: 1, started: 1 })
    const { queueTask } = useQueue()
    const props = useMemo(
      () => ({ initialState, isDocumentForm, schemaPath: 'posts', select }),
      [select],
    )
    const args = useMemo(
      () => ({ contextRef, onApplied, props, queueTask, submissionActivityRef }),
      [props, queueTask],
    )

    current = useFormState(args)

    contextRef.current.getData = () => getDataFromFormState(contextRef.current.fields, true)
    contextRef.current.getSiblingData = () => ({})
    contextRef.current.setModified = current.setModified

    return null
  }

  const render = ({ select }: { select?: FormProps['select'] } = {}) => {
    act(() => {
      root.render(
        React.createElement(
          LivePreviewContext,
          {
            value: {
              isLivePreviewEnabled: true,
              isPreviewEnabled: true,
              setPreviewURL,
              setURL,
              typeofLivePreviewURL: 'function',
            } as React.ContextType<typeof LivePreviewContext>,
          },
          React.createElement(Fixture, { select }),
        ),
      )
    })
  }

  const unmount = () => {
    if (!isUnmounted) {
      root.unmount()
      isUnmounted = true
    }
  }

  render()
  cleanups.push(unmount)

  return {
    get current() {
      return current
    },
    onApplied,
    render,
    setPreviewURL,
    setURL,
    unmount: () => act(unmount),
  }
}

function createState({ title }: { title: string }): FormState {
  return { title: { initialValue: title, valid: true, value: title } }
}
