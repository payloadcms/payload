import type { ReactNode } from 'react'

import { afterEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { requests } from '../../utilities/api.js'
import { PublishButton } from './index.js'

const mocks = vi.hoisted(() => ({ submit: vi.fn(), branch: 'pain' }))

vi.mock('../../forms/Form/context.js', () => ({
  useForm: () => ({ getData: () => ({ title: 'Branch page' }), submit: mocks.submit }),
  useFormModified: () => true,
}))
vi.mock('../../forms/Submit/index.js', () => ({
  FormSubmit: ({ SubMenuPopupContent }: { SubMenuPopupContent: () => ReactNode }) => (
    <SubMenuPopupContent />
  ),
}))
vi.mock('../Popup/index.js', () => ({
  PopupList: {
    Button: ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
      <button onClick={onClick} type="button">
        {children}
      </button>
    ),
    ButtonGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  },
}))
vi.mock('../../hooks/useHotkey.js', () => ({ useHotkey: () => undefined }))
vi.mock('../../providers/Branch/index.js', () => ({ useBranchParam: () => mocks.branch }))
vi.mock('../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: {
      blocksMap: {},
      localization: {
        locales: [
          { code: 'en', label: 'English' },
          { code: 'es', label: 'Spanish' },
        ],
      },
      routes: { api: '/api' },
    },
    getEntityConfig: () => ({
      fields: [{ name: 'title', type: 'text', localized: true }],
      versions: { drafts: true },
    }),
  }),
}))
vi.mock('../../providers/DocumentInfo/index.js', () => ({
  useDocumentInfo: () => ({
    id: 'branch-only-page',
    collectionSlug: 'pages',
    hasPublishPermission: true,
    setHasPublishedDoc: () => undefined,
    setMostRecentVersionIsAutosaved: () => undefined,
    setUnpublishedVersionCount: () => undefined,
    unpublishedVersionCount: 0,
  }),
}))
vi.mock('../../providers/EditDepth/index.js', () => ({ useEditDepth: () => 0 }))
vi.mock('../../providers/Locale/index.js', () => ({ useLocale: () => ({ code: 'en' }) }))
vi.mock('../../providers/Operation/index.js', () => ({ useOperation: () => 'update' }))
vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: {}, t: (key: string) => key }),
}))
vi.mock('../../providers/UploadEdits/index.js', () => ({ useUploadEdits: () => ({}) }))
vi.mock('../../utilities/api.js', () => ({ requests: { post: vi.fn() } }))

afterEach(() => vi.unstubAllGlobals())

test('should validate and publish in the active branch after the branch changes', async () => {
  vi.stubGlobal('process', { env: {} })
  mocks.branch = 'pain'
  mocks.submit.mockReset().mockResolvedValue(true)
  vi.mocked(requests.post)
    .mockReset()
    .mockImplementation(async () => Response.json({ errors: [], valid: true }))

  const screen = await render(<PublishButton />)

  await screen.getByRole('button', { name: 'version:publishAllLocales' }).click()
  await expect.poll(() => mocks.submit.mock.calls.length).toBe(1)

  mocks.branch = 'another-branch'
  await screen.rerender(<PublishButton />)
  await screen.getByRole('button', { name: 'version:publishAllLocales' }).click()
  await expect.poll(() => mocks.submit.mock.calls.length).toBe(2)

  expect(requests.post).toHaveBeenCalledTimes(4)
  for (const [index, [url]] of vi.mocked(requests.post).mock.calls.entries()) {
    const query = new URL(url, 'http://localhost').searchParams

    expect(query.get('branch')).toBe(index < 2 ? 'pain' : 'another-branch')
    expect(query.getAll('locale')).toEqual(index % 2 === 0 ? ['en'] : ['es'])
  }
  for (const [index, [args]] of mocks.submit.mock.calls.entries()) {
    expect(new URL(args.action, 'http://localhost').searchParams.get('branch')).toBe(
      index === 0 ? 'pain' : 'another-branch',
    )
  }
})
