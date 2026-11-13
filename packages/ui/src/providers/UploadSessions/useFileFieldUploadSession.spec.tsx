import { describe, expect, test, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'

import type { useSearchParams } from '../RouterAdapter/index.js'

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

describe('useFileFieldUploadSession', () => {
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
})
