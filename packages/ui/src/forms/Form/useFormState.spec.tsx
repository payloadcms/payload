import type { FormState } from 'payload'

import { useRef } from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'

import type { SubmissionActivity } from './useFormState.js'
import type { Context as FormContextType } from './types.js'

import { useQueue } from '../../hooks/useQueue.js'
import { useFormState } from './useFormState.js'

const { document, getFormState } = vi.hoisted(() => ({
  document: {},
  getFormState: vi.fn(),
}))

vi.mock('../../providers/Auth/index.js', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('../../providers/Config/index.js', () => ({ useConfig: () => ({ config: {} }) }))
vi.mock('../../providers/DocumentInfo/index.js', () => ({ useDocumentInfo: () => document }))
vi.mock('../../providers/Operation/index.js', () => ({ useOperation: () => 'update' }))
vi.mock('../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ getFormState }),
}))
vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('./context.js', () => ({ useDocumentForm: () => undefined }))

const initialState: FormState = {}
const onApplied = vi.fn()
const props = { initialState, schemaPath: 'posts' }

const renderFormState = () =>
  renderHook(() => {
    const { queueTask } = useQueue()
    const contextRef = useRef({ fields: initialState } as FormContextType)
    const submissionActivityRef = useRef<SubmissionActivity>({ running: 0, started: 0 })

    return useFormState({ contextRef, onApplied, props, queueTask, submissionActivityRef })
  })

/** Starts a refresh whose reply waits, then queues a second refresh behind it. */
const startRefreshAndQueueAnother = async () => {
  let replyToFirstRefresh: (response: { state: FormState }) => void = () => {}

  getFormState.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        replyToFirstRefresh = resolve
      }),
  )

  const hook = await renderFormState()

  hook.result.current.refreshFormState()
  await expect.poll(() => getFormState.mock.calls.length).toBe(1)
  hook.result.current.refreshFormState()

  return { hook, replyToFirstRefresh }
}

/** Gives a queued refresh time to start and send its request. */
const waitForQueuedRefresh = () => new Promise((resolve) => setTimeout(resolve, 50))

describe('useFormState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getFormState.mockResolvedValue({ state: {} })
  })

  test('should run a queued refresh after the running one ends', async () => {
    const { replyToFirstRefresh } = await startRefreshAndQueueAnother()

    replyToFirstRefresh({ state: {} })

    await expect.poll(() => getFormState.mock.calls.length).toBe(2)
  })

  test('should not run a queued refresh after the refresh is cancelled', async () => {
    const { hook, replyToFirstRefresh } = await startRefreshAndQueueAnother()

    hook.result.current.cancelFormStateRefresh()
    replyToFirstRefresh({ state: {} })
    await waitForQueuedRefresh()

    expect(getFormState).toHaveBeenCalledTimes(1)
  })
})
