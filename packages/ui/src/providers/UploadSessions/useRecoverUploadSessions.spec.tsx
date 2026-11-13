import type { ClientUploadSession } from 'payload'

import { toast } from 'sonner'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'

import {
  cancelUploadSession,
  isUploadSessionGoneError,
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
  isUploadSessionGoneError: vi.fn(),
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

type ToastButton = { onClick: (event: MouseEvent) => void }

const getLastOffer = () => vi.mocked(toast.warning).mock.calls.at(-1)![1]!

/** Clicks "Select file" on the recovery offer that was shown last. */
const clickSelectFile = () => {
  const event = new MouseEvent('click', { cancelable: true })

  ;(getLastOffer().action as ToastButton).onClick(event)

  return event
}

/** Clicks "Cancel upload" on the recovery offer that was shown last. */
const clickCancel = () => {
  ;(getLastOffer().cancel as ToastButton).onClick(new MouseEvent('click'))
}

describe('useRecoverUploadSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isUploadSessionGoneError).mockReturnValue(false)
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

  test('should offer recovery again with the error when a recovery upload fails', async () => {
    const err = new Error('Network down')

    vi.mocked(resumeUploadSession).mockRejectedValue(err)
    await renderRecovery()

    clickSelectFile()

    await expect.poll(() => vi.mocked(toast.warning).mock.calls.length).toBe(2)
    expect(getLastOffer()).toMatchObject({
      action: { label: 'upload:selectFile' },
      description: String(err),
    })
    expect(toast.error).not.toHaveBeenCalled()
  })

  test('should show an error without a new offer when the session no longer exists', async () => {
    vi.mocked(resumeUploadSession).mockRejectedValue(new Error('Not found'))
    vi.mocked(isUploadSessionGoneError).mockReturnValue(true)
    await renderRecovery()

    clickSelectFile()

    await expect.poll(() => vi.mocked(toast.error).mock.calls.length).toBe(1)
    expect(toast.warning).toHaveBeenCalledTimes(1)
  })

  test('should offer recovery again with the error when cancelling fails', async () => {
    const err = new Error('Network down')

    vi.mocked(cancelUploadSession).mockRejectedValue(err)
    await renderRecovery()

    clickCancel()

    await expect.poll(() => vi.mocked(toast.warning).mock.calls.length).toBe(2)
    expect(getLastOffer()).toMatchObject({ description: String(err) })
  })

  test('should not offer recovery again when the cancelled session no longer exists', async () => {
    vi.mocked(cancelUploadSession).mockRejectedValue(new Error('Not found'))
    vi.mocked(isUploadSessionGoneError).mockReturnValue(true)
    await renderRecovery()

    clickCancel()

    await expect.poll(() => vi.mocked(isUploadSessionGoneError).mock.calls.length).toBe(1)
    expect(toast.warning).toHaveBeenCalledTimes(1)
    expect(toast.error).not.toHaveBeenCalled()
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
