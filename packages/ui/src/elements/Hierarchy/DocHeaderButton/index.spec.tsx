import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { HierarchyButtonClient } from './index.js'

const dispatchField = vi.hoisted(() => vi.fn())
const openModal = vi.hoisted(() => vi.fn())
const translate = vi.hoisted(() => (key: string) => key)

vi.mock('../../../forms/Form/context.js', () => ({
  useForm: () => ({ disabled: false, setModified: vi.fn() }),
  useFormFields: (selector: (state: unknown[]) => unknown) =>
    selector([{ parent: { value: 'folder-1' } }, dispatchField]),
}))

vi.mock('../../../providers/Branch/index.js', () => ({
  useBranchParam: () => 'feature-branch',
}))

vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: { routes: { api: '/api' }, serverURL: 'http://localhost:3000' },
    getEntityConfig: () => ({ admin: { useAsTitle: 'title' } }),
  }),
}))

vi.mock('../../../providers/DocumentInfo/index.js', () => ({
  useDocumentInfo: () => ({ collectionSlug: 'posts' }),
}))

vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: translate }),
}))

vi.mock('../../Button/index.js', () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}))

vi.mock('../ActionsMenu/index.js', () => ({
  HierarchyActionsMenu: ({
    renderTrigger,
  }: {
    renderTrigger: (triggerProps: undefined) => React.ReactNode
  }) => renderTrigger(undefined),
}))

vi.mock('../Modal/useHierarchyModal.js', () => ({
  useHierarchyModal: () => [() => null, undefined, { openModal }],
}))

beforeEach(() => {
  vi.stubGlobal('process', { env: {} })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ json: async () => ({ id: 'folder-1', title: 'Folder' }), ok: true })),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('should fetch the selected hierarchy item from the active branch', async () => {
  await render(<HierarchyButtonClient fieldName="parent" hierarchyCollectionSlug="folders" />)

  await expect.poll(() => vi.mocked(fetch).mock.calls.length).toBe(1)

  const requestURL = new URL(String(vi.mocked(fetch).mock.calls[0][0]))
  expect(requestURL.searchParams.get('branch')).toBe('feature-branch')
})
