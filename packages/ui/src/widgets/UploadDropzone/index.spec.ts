// @vitest-environment happy-dom
import type { Root } from 'react-dom/client'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UploadDropzoneWidgetClient } from './index.client.js'

const mocks = vi.hoisted(() => ({
  openModal: vi.fn(),
  refresh: vi.fn(),
  error: vi.fn(),
  bulk: {
    modalSlug: 'bulk-upload',
    setCollectionSlug: vi.fn(),
    setInitialFiles: vi.fn(),
    setInitialForms: vi.fn(),
    setParentID: vi.fn(),
    setMaxFiles: vi.fn(),
    setSelectableCollections: vi.fn(),
    setOnCancel: vi.fn(),
    setOnSuccess: vi.fn(),
  },
}))
vi.mock('@faceless-ui/modal', () => ({ useModal: () => ({ openModal: mocks.openModal }) }))
vi.mock('../../elements/BulkUpload/index.js', () => ({ useBulkUpload: () => mocks.bulk }))
vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: (key) => key }),
}))
vi.mock('../../providers/RouterAdapter/index.js', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))
vi.mock('../../elements/Button/index.js', () => ({
  Button: ({ children, onClick }) => createElement('button', { onClick }, children),
}))
vi.mock('sonner', () => ({ toast: { error: mocks.error } }))
let container: HTMLDivElement
let root: Root
beforeEach(() => {
  vi.clearAllMocks()
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() =>
    root.render(
      createElement(UploadDropzoneWidgetClient, {
        collectionSlug: 'media',
        mimeTypes: ['image/*'],
      }),
    ),
  )
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  delete globalThis.IS_REACT_ACT_ENVIRONMENT
})
function dropFiles({ type }: { type: string }) {
  const files = [new File(['content'], 'example', { type })]
  const event = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: { files, clearData: vi.fn() } })
  act(() => container.querySelector('.dropzone').dispatchEvent(event))
  return files
}

describe('dashboard upload dropzone', () => {
  it('should open the configured collection and reset stale upload context', () => {
    act(() => container.querySelector('button').click())
    expect(mocks.bulk.setCollectionSlug).toHaveBeenCalledWith('media')
    expect(mocks.bulk.setInitialForms).toHaveBeenCalledWith(undefined)
    expect(mocks.bulk.setInitialFiles).toHaveBeenCalledWith(undefined)
    expect(mocks.bulk.setParentID).toHaveBeenCalledWith(undefined)
    expect(mocks.bulk.setMaxFiles).toHaveBeenCalledWith(undefined)
    expect(mocks.bulk.setSelectableCollections).toHaveBeenCalledWith(null)
    expect(mocks.openModal).toHaveBeenCalledWith('bulk-upload')
  })
  it('should hand dropped files to the bulk upload workflow', () => {
    const files = dropFiles({ type: 'image/png' })
    expect(mocks.bulk.setInitialFiles).toHaveBeenCalledWith(files)
    expect(mocks.openModal).toHaveBeenCalledOnce()
    expect(mocks.refresh).not.toHaveBeenCalled()
    mocks.bulk.setOnSuccess.mock.calls[0][0]()
    expect(mocks.refresh).toHaveBeenCalledOnce()
  })
  it('should reject an incompatible file before opening bulk upload', () => {
    dropFiles({ type: 'application/pdf' })
    expect(mocks.error).toHaveBeenCalledWith('error:invalidFileType')
    expect(mocks.openModal).not.toHaveBeenCalled()
  })
})
