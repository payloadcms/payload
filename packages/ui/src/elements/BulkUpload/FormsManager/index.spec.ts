// @vitest-environment jsdom

import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  bulkUploadFailureEvent,
  bulkUploadPrepareFilesEvent,
  FormsManagerProvider,
  useFormsManager,
} from './index.js'

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => ({
  closeModal: vi.fn(),
  initialFiles: undefined as File[] | undefined,
  initialForms: undefined as
    | {
        file: File
        formID: string
        initialState: object
      }[]
    | undefined,
  onSuccess: vi.fn(),
  setInitialFiles: vi.fn(),
  setInitialForms: vi.fn(),
  setSuccessfullyUploaded: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toggleLoadingOverlay: vi.fn(),
  uploadResponse: vi.fn(),
}))

vi.mock('@faceless-ui/modal', () => ({
  useModal: () => ({ closeModal: mocks.closeModal }),
}))

vi.mock('sonner', () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}))

vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: {
      collections: [{ slug: 'media', upload: {} }],
      folders: { fieldName: 'folder' },
      routes: { api: '/api' },
    },
  }),
}))

vi.mock('../../../providers/Locale/index.js', () => ({
  useLocale: () => ({ code: 'en' }),
}))

vi.mock('../../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({
    getDocumentSlots: vi.fn().mockResolvedValue({}),
    getFormState: vi.fn().mockResolvedValue({ state: {} }),
  }),
}))

vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => key,
  }),
}))

vi.mock('../../../providers/UploadHandlers/index.js', () => ({
  useUploadHandlers: () => ({ getUploadHandler: () => undefined }),
}))

vi.mock('../../Loading/index.js', () => ({
  LoadingOverlay: () => null,
}))

vi.mock('../../LoadingOverlay/index.js', () => ({
  useLoadingOverlay: () => ({ toggleLoadingOverlay: mocks.toggleLoadingOverlay }),
}))

vi.mock('../index.js', () => ({
  useBulkUpload: () => ({
    collectionSlug: 'media',
    drawerSlug: 'bulk-upload',
    folderID: undefined,
    initialFiles: mocks.initialFiles,
    initialForms: mocks.initialForms,
    onSuccess: mocks.onSuccess,
    setInitialFiles: mocks.setInitialFiles,
    setInitialForms: mocks.setInitialForms,
    setSuccessfullyUploaded: mocks.setSuccessfullyUploaded,
  }),
}))

function BulkUploadHarness(): React.JSX.Element {
  const { activeIndex, forms, getFormDataRef, saveAllDocs } = useFormsManager()
  const fileValue = forms[0]?.formState?.file?.value

  getFormDataRef.current = () => forms[activeIndex]?.formState ?? {}

  return React.createElement(
    'button',
    {
      'data-error-count': forms[0]?.errorCount ?? 0,
      'data-file-name': fileValue instanceof File ? fileValue.name : '',
      'data-form-count': forms.length,
      onClick: () => void saveAllDocs(),
      type: 'button',
    },
    'Save uploads',
  )
}

async function flushEffects(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('Payload bulk upload failures', () => {
  let container: HTMLDivElement
  let preparationListener: (event: Event) => void
  let root: Root
  let telemetryListener = vi.fn<(event: Event) => void>()

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.initialFiles = undefined
    preparationListener = () => {}
    telemetryListener = vi.fn<(event: Event) => void>()
    mocks.initialForms = [
      {
        file: new File(['image'], 'city-cover.webp', { type: 'image/webp' }),
        formID: 'city-cover',
        initialState: {},
      },
    ]
    container = document.createElement('div')
    document.body.append(container)

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes('/access')) {
          return Response.json({ create: true, update: true })
        }

        return mocks.uploadResponse()
      }),
    )

    mocks.uploadResponse.mockResolvedValue(
      new Response('<html>Too Many Requests</html>', {
        headers: { 'content-type': 'text/html' },
        status: 429,
      }),
    )
    root = createRoot(container)
  })

  afterEach(() => {
    window.removeEventListener(bulkUploadFailureEvent, telemetryListener)
    window.removeEventListener(bulkUploadPrepareFilesEvent, preparationListener)
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  it('should keep a file failed when the API returns a non-JSON edge response', async () => {
    window.addEventListener(bulkUploadFailureEvent, telemetryListener, { once: true })

    act(() => {
      root.render(
        React.createElement(FormsManagerProvider, null, React.createElement(BulkUploadHarness)),
      )
    })
    await flushEffects()
    await flushEffects()

    const button = container.querySelector('button')
    if (!button) {
      throw new Error('Expected the bulk upload harness button to render.')
    }
    expect(button.dataset.formCount).toBe('1')

    await act(async () => button.click())
    await flushEffects()

    expect(button.dataset.formCount).toBe('1')
    expect(button.dataset.errorCount).toBe('1')
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
    expect(mocks.toastError).toHaveBeenNthCalledWith(
      1,
      'The upload request failed before Payload returned a valid response.',
    )
    expect(mocks.toastError).toHaveBeenNthCalledWith(2, 'Failed to save 1 files')
    expect(mocks.onSuccess).not.toHaveBeenCalled()
    expect(mocks.closeModal).not.toHaveBeenCalled()
    expect(telemetryListener).toHaveBeenCalledOnce()

    const telemetryEvent = telemetryListener.mock.calls[0]?.[0]
    if (!(telemetryEvent instanceof CustomEvent)) {
      throw new Error('Expected bulk upload failure telemetry to use a CustomEvent.')
    }
    expect(telemetryEvent.detail).toMatchObject({
      collectionSlug: 'media',
      error: expect.any(Error),
      fileIndex: 0,
      responseContentType: 'text/html',
      responseStatus: 429,
      totalFiles: 1,
    })
  })

  it('should wait for bulk file preparation before creating upload forms', async () => {
    const sourceFile = new File(['large'], 'city-cover.jpg', { type: 'image/jpeg' })
    const preparedFile = new File(['small'], 'city-cover.webp', { type: 'image/webp' })
    mocks.initialFiles = [sourceFile]
    mocks.initialForms = undefined
    preparationListener = (event: Event) => {
      if (event instanceof CustomEvent) {
        Reflect.set(event.detail, 'preparation', Promise.resolve([preparedFile]))
      }
    }
    window.addEventListener(bulkUploadPrepareFilesEvent, preparationListener)

    act(() => {
      root.render(
        React.createElement(FormsManagerProvider, null, React.createElement(BulkUploadHarness)),
      )
    })
    await flushEffects()
    await flushEffects()

    const button = container.querySelector('button')
    if (!button) {
      throw new Error('Expected the bulk upload harness button to render.')
    }

    expect(button.dataset.formCount).toBe('1')
    expect(button.dataset.fileName).toBe('city-cover.webp')
  })

  it('should preserve the native success path for a created media document', async () => {
    mocks.uploadResponse.mockResolvedValue(
      Response.json({ doc: { id: 91, filename: 'city-cover.webp' } }, { status: 201 }),
    )

    act(() => {
      root.render(
        React.createElement(FormsManagerProvider, null, React.createElement(BulkUploadHarness)),
      )
    })
    await flushEffects()
    await flushEffects()

    const button = container.querySelector('button')
    if (!button) {
      throw new Error('Expected the bulk upload harness button to render.')
    }

    await act(async () => button.click())
    await flushEffects()

    expect(button.dataset.formCount).toBe('0')
    expect(mocks.toastError).not.toHaveBeenCalled()
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Successfully saved 1 files')
    expect(mocks.onSuccess).toHaveBeenCalledWith(
      [
        {
          collectionSlug: 'media',
          doc: { id: 91, filename: 'city-cover.webp' },
          formID: 'city-cover',
        },
      ],
      0,
    )
    expect(mocks.closeModal).toHaveBeenCalledWith('bulk-upload')
  })
})
