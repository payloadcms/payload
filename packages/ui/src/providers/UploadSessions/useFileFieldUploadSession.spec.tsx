import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'

import type { useSearchParams } from '../RouterAdapter/index.js'
import type { UploadSessionsContext } from './index.js'

import { useFileFieldUploadSession } from './useFileFieldUploadSession.js'

const form = { getDataByPath: () => undefined }

vi.mock('../../forms/Form/index.js', () => ({
  useForm: () => form,
}))

vi.mock('../DocumentInfo/index.js', () => ({
  useDocumentInfo: () => ({ id: undefined }),
}))

const searchParams = new URLSearchParams('uploadSession=session-1')

vi.mock(import('../RouterAdapter/index.js'), async (importOriginal) => ({
  ...(await importOriginal()),
  useSearchParams: () => searchParams as ReturnType<typeof useSearchParams>,
}))

const uploadSessions = vi.hoisted(() => ({ current: null as null | UploadSessionsContext }))

vi.mock(import('./index.js'), async (importOriginal) => ({
  ...(await importOriginal()),
  useOptionalUploadSessions: () => uploadSessions.current,
}))

const placeholder = new File([], 'video.mp4', { type: 'video/mp4' })

/** Upload sessions whose `adopt` resolves only when the test calls `resolveAdoption`. */
const createHeldAdoption = () => {
  let resolveAdoption = () => {}
  const adoption = new Promise<File>((resolve) => {
    resolveAdoption = () => resolve(placeholder)
  })
  const sessions = {
    adopt: vi.fn(() => adoption),
    cancel: vi.fn(),
    detach: vi.fn(),
    start: vi.fn(),
  } as unknown as UploadSessionsContext

  return { adoption, resolveAdoption, sessions }
}

type HookProps = Parameters<typeof useFileFieldUploadSession>[0]

const createProps = (): HookProps => ({
  collectionSlug: 'videos',
  hasStoredFile: false,
  setFilename: vi.fn(),
  setRemovedFile: vi.fn(),
  setValue: vi.fn(),
})

describe('useFileFieldUploadSession', () => {
  beforeEach(() => {
    uploadSessions.current = null
  })

  test('should upload without a session when no upload sessions provider is rendered', async () => {
    const setValue = vi.fn()
    const hook = await renderHook(() =>
      useFileFieldUploadSession({
        collectionSlug: 'videos',
        hasStoredFile: false,
        setFilename: vi.fn(),
        setRemovedFile: vi.fn(),
        setValue,
      }),
    )

    hook.result.current.onFileChange({
      file: new File(['x'], 'video.mp4', { type: 'video/mp4' }),
      isNewFile: true,
    })
    await hook.rerender()

    expect(hook.result.current.hasUploadSession).toBe(false)
    expect(setValue).not.toHaveBeenCalled()

    await hook.unmount()
  })

  test('should detach an attached upload that arrives after the form closed', async () => {
    const { adoption, resolveAdoption, sessions } = createHeldAdoption()

    uploadSessions.current = sessions
    const props = createProps()
    const hook = await renderHook(() => useFileFieldUploadSession(props))

    await hook.unmount()
    resolveAdoption()
    await adoption
    await Promise.resolve()

    expect(sessions.detach).toHaveBeenCalledWith({ file: placeholder })
    expect(props.setValue).not.toHaveBeenCalled()
  })

  test('should keep an attached upload when the lookup effect runs again for the same session', async () => {
    const { adoption, resolveAdoption, sessions } = createHeldAdoption()

    uploadSessions.current = sessions
    const props = createProps()
    const hook = await renderHook(
      (hookProps?: HookProps) => useFileFieldUploadSession(hookProps!),
      {
        initialProps: props,
      },
    )

    // A changed `hasStoredFile` runs the lookup effect again, and it reuses the pending adoption.
    await hook.rerender({ ...props, hasStoredFile: true })
    resolveAdoption()
    await adoption
    await hook.rerender({ ...props, hasStoredFile: true })

    expect(sessions.detach).not.toHaveBeenCalled()
    expect(props.setValue).toHaveBeenCalledWith(placeholder)

    await hook.unmount()
  })
})
