import type { FormState, SanitizedDocumentPermissions } from 'payload'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { FormsManagerProvider, useFormsManager } from './index.js'

vi.stubGlobal('process', { env: {} })

const mocks = vi.hoisted(() => ({
  bulkUpload: { collectionSlug: 'a' },
  fetch: vi.fn(),
  getDocumentSlots: vi.fn(),
  getFormState: vi.fn(),
}))

vi.mock('@faceless-ui/modal', () => ({ useModal: () => ({ closeModal: vi.fn() }) }))
vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: { collections: [], routes: { api: '/api' } },
    getEntityConfig: ({ collectionSlug }: { collectionSlug: string }) => ({
      fields: [],
      slug: collectionSlug,
      upload: {},
    }),
  }),
}))
vi.mock('../../../providers/Locale/index.js', () => ({ useLocale: () => ({ code: 'en' }) }))
vi.mock('../../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({
    getDocumentSlots: mocks.getDocumentSlots,
    getFormState: mocks.getFormState,
  }),
}))
vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key }),
}))
vi.mock('../../../providers/UploadHandlers/index.js', () => ({
  useUploadHandlers: () => ({ getUploadHandler: () => undefined }),
}))
vi.mock('../../LoadingOverlay/index.js', () => ({
  useLoadingOverlay: () => ({ toggleLoadingOverlay: vi.fn() }),
}))
vi.mock('../index.js', () => ({
  useBulkUpload: () => ({
    collectionSlug: mocks.bulkUpload.collectionSlug,
    modalSlug: 'bulk-upload',
    selectableCollections: ['a', 'b'],
    setCollectionSlug: vi.fn(),
    setInitialFiles: vi.fn(),
    setInitialForms: vi.fn(),
    setSuccessfullyUploaded: vi.fn(),
  }),
}))

/** Permissions that name the collection they belong to, so tests can tell them apart. */
const permissionsFor = (collectionSlug: string) =>
  ({
    create: true,
    fields: { [collectionSlug]: { create: true } },
  }) as unknown as SanitizedDocumentPermissions

const jsonResponse = ({ body }: { body: unknown }) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })

const getAccessCollectionSlug = (url: string) => url.match(/\/api\/([^/]+)\/access/)?.[1]

let formsManager: ReturnType<typeof useFormsManager>

function Consumer() {
  formsManager = useFormsManager()
  return null
}

const renderFormsManager = () => (
  <FormsManagerProvider>
    <Consumer />
  </FormsManagerProvider>
)

beforeEach(() => {
  mocks.bulkUpload.collectionSlug = 'a'
  mocks.fetch
    .mockReset()
    .mockImplementation((url: string) =>
      Promise.resolve(jsonResponse({ body: permissionsFor(getAccessCollectionSlug(url)) })),
    )
  mocks.getDocumentSlots.mockReset().mockResolvedValue({})
  mocks.getFormState.mockReset().mockResolvedValue({ state: {} })
  vi.stubGlobal('fetch', mocks.fetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.stubGlobal('process', { env: {} })
})

test('should load permissions again when returning to a collection after another collection replaced them', async () => {
  let resolveFormStateB: (result: { state: FormState }) => void
  const formStateB = new Promise<{ state: FormState }>((resolve) => {
    resolveFormStateB = resolve
  })

  mocks.getFormState.mockImplementation(({ collectionSlug }: { collectionSlug: string }) =>
    collectionSlug === 'b' ? formStateB : Promise.resolve({ state: {} }),
  )

  const { rerender } = await render(renderFormsManager())

  await vi.waitFor(() => expect(formsManager.docPermissions).toEqual(permissionsFor('a')))

  mocks.bulkUpload.collectionSlug = 'b'
  await rerender(renderFormsManager())

  await vi.waitFor(() => expect(formsManager.docPermissions).toEqual(permissionsFor('b')))
  await vi.waitFor(() =>
    expect(mocks.getFormState).toHaveBeenCalledWith(
      expect.objectContaining({ collectionSlug: 'b' }),
    ),
  )

  mocks.bulkUpload.collectionSlug = 'a'
  await rerender(renderFormsManager())
  resolveFormStateB!({ state: {} })

  await vi.waitFor(() => expect(formsManager.docPermissions).toEqual(permissionsFor('a')))
})
