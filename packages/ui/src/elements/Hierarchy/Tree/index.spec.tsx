import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { HierarchyInitialData } from './types.js'

import { HierarchyTree } from './index.js'

const branchState = vi.hoisted<{ current: string | undefined }>(() => ({ current: undefined }))

vi.mock('@faceless-ui/modal', () => ({
  useModal: () => ({ closeModal: vi.fn(), openModal: vi.fn() }),
}))

vi.mock('../../../providers/Auth/index.js', () => ({
  useAuth: () => ({ permissions: { collections: { folders: { create: false } } } }),
}))

vi.mock('../../../providers/Branch/index.js', () => ({
  useBranchParam: () => branchState.current,
}))

vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: {
      routes: { api: '/api' },
      serverURL: 'http://localhost:3000',
    },
    getEntityConfig: () => ({
      admin: { useAsTitle: 'name' },
      hierarchy: {
        admin: { treeLimit: 10 },
        parentFieldName: 'parent',
      },
      labels: { plural: 'Folders', singular: 'Folder' },
    }),
  }),
}))

vi.mock('../../../providers/Hierarchy/index.js', () => ({
  useHierarchy: () => ({
    getExpandedNodesForCollection: () => new Set(),
    getTreeDataForCollection: () => null,
    toggleNodeForCollection: vi.fn(),
    typeFieldName: null,
  }),
}))

vi.mock('../../../providers/RouterAdapter/index.js', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key }),
}))

vi.mock('../../../icons/Plus/index.js', () => ({
  PlusIcon: () => null,
}))

vi.mock('../../Button/index.js', () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}))

vi.mock('../../CreateDocumentButton/index.js', () => ({
  CreateDocumentButton: () => null,
}))

vi.mock('../../DelayedSpinner/index.js', () => ({
  DelayedSpinner: () => <div>Loading</div>,
}))

vi.mock('../../DocumentDrawer/index.js', () => ({
  DocumentDrawer: () => null,
}))

vi.mock('./LoadMore/index.js', () => ({
  LoadMore: () => null,
}))

vi.mock('./TreeNode/index.js', () => ({
  TreeNode: ({ node }: { node: { title: string } }) => <div>{node.title}</div>,
}))

beforeEach(() => {
  branchState.current = undefined
  vi.stubGlobal('process', { env: {} })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      json: async () => ({
        docs: [{ id: 'feature-folder', name: 'Feature folder' }],
        hasNextPage: false,
        totalDocs: 1,
      }),
      ok: true,
    })),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('should fetch the active branch after switching away from main', async () => {
  const mainInitialData = {
    branch: null,
    docs: [{ id: 'main-folder', name: 'Main folder' }],
    loadedParents: {
      null: { hasMore: false, loadedCount: 1, totalDocs: 1 },
    },
  } satisfies HierarchyInitialData

  const screen = await render(
    <HierarchyTree collectionSlug="folders" initialData={mainInitialData} useAsTitle="name" />,
  )

  await expect.element(screen.getByText('Main folder')).toBeVisible()
  expect(fetch).not.toHaveBeenCalled()

  branchState.current = 'feature'
  await screen.rerender(
    <HierarchyTree collectionSlug="folders" initialData={mainInitialData} useAsTitle="name" />,
  )

  await expect.poll(() => vi.mocked(fetch).mock.calls.length).toBe(1)

  const requestURL = new URL(String(vi.mocked(fetch).mock.calls[0][0]))

  expect(requestURL.searchParams.get('branch')).toBe('feature')
})
