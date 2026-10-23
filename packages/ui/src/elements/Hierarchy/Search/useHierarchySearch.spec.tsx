import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { useHierarchySearch } from './useHierarchySearch.js'

const branchState = vi.hoisted(() => ({ current: 'first-branch' }))

vi.mock('../../../providers/Branch/index.js', () => ({
  useBranchParam: () => branchState.current,
}))

vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: {
      routes: { api: '/api' },
      serverURL: 'http://localhost:3000',
    },
  }),
}))

vi.mock('../../../providers/Locale/index.js', () => ({
  useLocale: () => null,
}))

beforeEach(() => {
  branchState.current = 'first-branch'
  vi.stubGlobal('process', { env: {} })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      json: async () => ({ docs: [], hasNextPage: false, totalDocs: 0 }),
      ok: true,
    })),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('should search the active branch after the branch changes', async () => {
  const screen = await render(<SearchFixture renderKey="first" />)

  await screen.getByRole('button', { name: 'Search' }).click()
  await expect.poll(() => vi.mocked(fetch).mock.calls.length).toBe(1)
  expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('branch=first-branch')

  branchState.current = 'second-branch'
  await screen.rerender(<SearchFixture renderKey="second" />)
  await screen.getByRole('button', { name: 'Search' }).click()

  await expect.poll(() => vi.mocked(fetch).mock.calls.length).toBe(2)
  expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain('branch=second-branch')
})

function SearchFixture({ renderKey }: { renderKey: string }) {
  const { search } = useHierarchySearch({
    collectionSlug: 'folders',
    titleField: 'title',
  })

  return (
    <button data-render-key={renderKey} onClick={() => void search('needle')} type="button">
      Search
    </button>
  )
}
