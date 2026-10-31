import { useRef } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { CachedChildren } from './types.js'

import { getBranchAwareChildrenCacheKey, useChildren } from './useChildren.js'

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

beforeEach(() => {
  branchState.current = 'first-branch'
  vi.stubGlobal('process', { env: {} })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const branch = new URL(String(input)).searchParams.get('branch')

      return {
        json: async () => ({
          docs: [{ id: `${branch}-child`, title: branch }],
          hasNextPage: false,
          totalDocs: 1,
        }),
        ok: true,
      }
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('should keep cached children separate and reset state when the branch changes', async () => {
  const screen = await render(<ChildrenFixture renderKey="first" />)

  await screen.getByRole('button', { name: 'Load children' }).click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('first-branch')

  branchState.current = 'second-branch'
  await screen.rerender(<ChildrenFixture renderKey="second" />)
  await expect.element(screen.getByRole('status')).toHaveTextContent('unloaded')

  await screen.getByRole('button', { name: 'Load children' }).click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('second-branch')

  branchState.current = 'first-branch'
  await screen.rerender(<ChildrenFixture renderKey="third" />)
  await expect.element(screen.getByRole('status')).toHaveTextContent('first-branch')
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2)
})

test('should fetch filtered children instead of restoring stale initial data', async () => {
  vi.mocked(fetch).mockImplementation(async () => ({
    json: async () => ({
      docs: [
        { id: 'general', title: 'General' },
        { allowedTypes: ['products'], id: 'products', title: 'Products Only' },
      ],
      hasNextPage: false,
      totalDocs: 2,
    }),
    ok: true,
  }))

  const screen = await render(<FilterChildrenFixture />)

  await expect
    .element(screen.getByRole('status'))
    .toHaveTextContent('General,Orgs Only,Products Only')

  await screen.rerender(<FilterChildrenFixture filterByCollections={['products']} />)

  await expect.element(screen.getByRole('status')).toHaveTextContent('General,Products Only')
  await expect.element(screen.getByRole('status')).not.toHaveTextContent('Orgs Only')
  expect(vi.mocked(fetch)).toHaveBeenCalledOnce()
})

function ChildrenFixture({ renderKey }: { renderKey: string }) {
  const cache = useRef<Map<string, CachedChildren>>(new Map())
  const { children, load } = useChildren({
    cache,
    collectionSlug: 'folders',
    enabled: false,
    parentFieldName: 'parent',
    parentId: 'null',
  })

  return (
    <div data-render-key={renderKey}>
      <output role="status">{children?.[0]?.title ? String(children[0].title) : 'unloaded'}</output>
      <button onClick={() => void load()} type="button">
        Load children
      </button>
    </div>
  )
}

function FilterChildrenFixture({ filterByCollections }: { filterByCollections?: string[] }) {
  const cache = useRef<Map<string, CachedChildren>>(new Map())
  const seededCacheKeys = useRef(new Set<string>())
  const filterKey = filterByCollections?.slice().sort().join(',') ?? ''
  const cacheKeyWithoutBranch = `folders-null-${filterKey}`
  const cacheKey = getBranchAwareChildrenCacheKey({
    branch: branchState.current,
    cacheKey: cacheKeyWithoutBranch,
  })

  if (!seededCacheKeys.current.has(cacheKey)) {
    seededCacheKeys.current.add(cacheKey)
    cache.current.set(cacheKey, {
      children: [
        { id: 'general', title: 'General' },
        { allowedTypes: ['organizations'], id: 'organizations', title: 'Orgs Only' },
        { allowedTypes: ['products'], id: 'products', title: 'Products Only' },
      ],
      hasMore: false,
      page: 1,
      totalDocs: 3,
    })
  }

  const { children } = useChildren({
    allPossibleTypeValues: ['organizations', 'products'],
    cache,
    cacheKey: cacheKeyWithoutBranch,
    collectionSlug: 'folders',
    filterByCollections,
    parentFieldName: 'parent',
    parentId: 'null',
    typeFieldName: 'allowedTypes',
  })

  return (
    <output role="status">{children?.map(({ title }) => title).join(',') ?? 'unloaded'}</output>
  )
}
