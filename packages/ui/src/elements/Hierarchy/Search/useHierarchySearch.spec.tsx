import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { useHierarchySearch } from './useHierarchySearch.js'

const state = vi.hoisted(() => ({ branch: 'first' }))

vi.mock('../../../providers/Branch/index.js', () => ({
  useBranchParam: () => state.branch,
}))
vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({ config: { routes: { api: '/api' }, serverURL: '' } }),
}))
vi.mock('../../../providers/Locale/index.js', () => ({ useLocale: () => ({ code: 'en' }) }))

beforeEach(() => {
  vi.stubGlobal('process', { env: {} })
  state.branch = 'first'
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('should reset pagination and ignore an old branch response after switching', async () => {
  let resolveOldPage: (response: Response) => void
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ docs: [{ id: 'first' }], hasNextPage: true, totalDocs: 2 }),
    )
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveOldPage = resolve
        }),
    )
    .mockResolvedValueOnce(
      Response.json({ docs: [{ id: 'second' }], hasNextPage: false, totalDocs: 1 }),
    )
  vi.stubGlobal('fetch', fetch)

  const screen = await render(<Fixture />)
  await screen.getByRole('button', { name: 'Search', exact: true }).click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('first:2:true:false')
  await screen.getByRole('button', { name: 'Load more' }).click()

  state.branch = 'second'
  await screen.rerender(<Fixture />)
  await expect.element(screen.getByRole('status')).toHaveTextContent(':0:false:false')
  await screen.getByRole('button', { name: 'Load more' }).click()
  expect(fetch).toHaveBeenCalledTimes(2)

  await screen.getByRole('button', { name: 'Search', exact: true }).click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('second:1:false:false')
  resolveOldPage(Response.json({ docs: [{ id: 'obsolete' }], hasNextPage: true, totalDocs: 2 }))
  await vi.waitFor(() => expect(fetch).toHaveResolvedTimes(3))
  await expect.element(screen.getByRole('status')).toHaveTextContent('second:1:false:false')
})

function Fixture() {
  const { hasNextPage, isLoading, loadMore, results, search, totalDocs } = useHierarchySearch({
    collectionSlug: 'folders',
    titleField: 'name',
  })

  return (
    <>
      <div role="status">
        {results.map(({ id }) => id).join(',')}:{totalDocs}:{String(hasNextPage)}:
        {String(isLoading)}
      </div>
      <button
        onClick={() => {
          void search('folder')
        }}
        type="button"
      >
        Search
      </button>
      <button
        onClick={() => {
          void loadMore()
        }}
        type="button"
      >
        Load more
      </button>
    </>
  )
}
