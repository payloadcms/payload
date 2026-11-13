import type { ClientUploadSession } from 'payload'

import { toast } from 'sonner'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'

import {
  listUploadSessions,
  resumeUploadSession,
  UploadSessionClientError,
} from '../../utilities/uploadWithSession.js'
import { pickFile } from './browser.js'
import { useRecoverUploadSessions } from './useRecoverUploadSessions.js'

vi.mock('sonner', () => ({
  toast: { dismiss: vi.fn(), error: vi.fn(), loading: vi.fn(), warning: vi.fn() },
}))

vi.mock(import('../../utilities/uploadWithSession.js'), async (importOriginal) => ({
  ...(await importOriginal()),
  cancelUploadSession: vi.fn(),
  listUploadSessions: vi.fn(),
  resumeUploadSession: vi.fn(),
}))

vi.mock('./browser.js', () => ({
  createProgressToast: () => ({ show: vi.fn() }),
  pickFile: vi.fn(),
}))

vi.mock('./otherTabs.js', () => ({
  findSessionsHeldByOtherTabs: () => Promise.resolve(new Set<string>()),
}))

const config = {
  collections: [{ upload: { uploadInstructions: { supportsSegmentedUploads: true } } }],
}
const getEntityConfig = () => undefined

vi.mock('../Config/index.js', () => ({
  useConfig: () => ({ config, getEntityConfig }),
}))

const t = (key: string) => key

vi.mock('../Translation/index.js', () => ({
  useTranslation: () => ({ t }),
}))

const session = {
  id: 'session-1',
  collectionSlug: 'videos',
  file: { filename: 'video.mp4', mimeType: 'video/mp4', size: 11 },
  hasIntent: true,
  isStorageComplete: false,
} as ClientUploadSession

const pickedFile = new File(['x'], 'video.mp4', { type: 'video/mp4' })
const requestArgs = { apiRoute: '/api', serverURL: '' }

type HookProps = Parameters<typeof useRecoverUploadSessions>[0]

const renderRecovery = async () => {
  const recoveringSessionIDsRef = { current: new Set<string>() }
  const props: HookProps = {
    finishInBackground: vi.fn(() => Promise.resolve()),
    getErrorMessage: (err) => String(err),
    recoveringSessionIDsRef,
    requestArgs,
    trackToast: (id) => id,
    userID: 'user-a',
  }
  const hook = await renderHook((hookProps?: HookProps) => useRecoverUploadSessions(hookProps!), {
    initialProps: props,
  })

  await expect.poll(() => vi.mocked(toast.warning).mock.calls.length).toBe(1)

  return { hook, props, recoveringSessionIDsRef }
}

/** Clicks "Select file" on the recovery offer that was shown last. */
const clickSelectFile = () => {
  const options = vi.mocked(toast.warning).mock.calls.at(-1)![1]!
  const action = options.action as { onClick: (event: MouseEvent) => void }
  const event = new MouseEvent('click', { cancelable: true })

  action.onClick(event)

  return event
}

describe('useRecoverUploadSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(listUploadSessions).mockResolvedValue([session])
    vi.mocked(pickFile).mockImplementation(({ onPick }) => onPick(pickedFile))
  })

  test('should keep the recovery offer open while the file picker is open', async () => {
    vi.mocked(pickFile).mockImplementation(() => {})
    await renderRecovery()

    expect(clickSelectFile().defaultPrevented).toBe(true)
  })

  test('should offer recovery again when the selected file does not match', async () => {
    vi.mocked(resumeUploadSession).mockRejectedValue(
      new UploadSessionClientError({ code: 'fileMismatch' }),
    )
    await renderRecovery()

    clickSelectFile()

    await expect.poll(() => vi.mocked(toast.warning).mock.calls.length).toBe(2)
    expect(vi.mocked(toast.warning).mock.calls[1]![1]).toMatchObject({
      id: `upload-session-recovery-${session.id}`,
      action: { label: 'upload:selectFile' },
    })
  })

  test('should stop a recovery upload when the user changes', async () => {
    let signal: AbortSignal | undefined

    vi.mocked(resumeUploadSession).mockImplementation(
      (args) =>
        new Promise((_resolve, reject) => {
          signal = args.signal
          args.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    )
    const { hook, props, recoveringSessionIDsRef } = await renderRecovery()

    clickSelectFile()
    expect(recoveringSessionIDsRef.current.has(String(session.id))).toBe(true)

    vi.mocked(listUploadSessions).mockResolvedValue([])
    await hook.rerender({ ...props, userID: 'user-b' })

    expect(signal?.aborted).toBe(true)
    expect(recoveringSessionIDsRef.current.has(String(session.id))).toBe(false)
    await Promise.resolve()
    expect(toast.error).not.toHaveBeenCalled()
    expect(props.finishInBackground).not.toHaveBeenCalled()
  })
})
