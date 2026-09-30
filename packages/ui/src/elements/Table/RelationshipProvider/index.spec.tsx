import { useEffect } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { RelationshipProvider, useListRelationships } from './index.js'

const branchState = vi.hoisted(() => ({ current: 'first-branch' }))
const translation = vi.hoisted(() => ({ i18n: { language: 'en' } }))
const config = vi.hoisted(() => ({
  collections: [{ admin: { useAsTitle: 'title' }, slug: 'posts' }],
  routes: { api: '/api' },
}))

vi.mock('../../../hooks/useDebounce.js', () => ({
  useDebounce: (value: unknown) => value,
}))

vi.mock('../../../providers/Branch/index.js', () => ({
  useBranchParam: () => branchState.current,
}))

vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({ config }),
}))

vi.mock('../../../providers/Locale/index.js', () => ({
  useLocale: () => null,
}))

vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => translation,
}))

beforeEach(() => {
  branchState.current = 'first-branch'
  vi.stubGlobal('process', { env: {} })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const branch = new URL(String(input), window.location.origin).searchParams.get('branch')

      return {
        json: async () => ({ docs: [{ id: 'post-1', title: branch }] }),
        ok: true,
      }
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('should reload cached relationship documents after the branch changes', async () => {
  const screen = await render(<RelationshipFixture renderKey="first" />)

  await expect.element(screen.getByRole('status')).toHaveTextContent('first-branch')

  branchState.current = 'second-branch'
  await screen.rerender(<RelationshipFixture renderKey="second" />)

  await expect.element(screen.getByRole('status')).toHaveTextContent('second-branch')
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2)
})

function RelationshipFixture({ renderKey }: { renderKey: string }) {
  return (
    <RelationshipProvider>
      <RelationshipConsumer renderKey={renderKey} />
    </RelationshipProvider>
  )
}

function RelationshipConsumer({ renderKey }: { renderKey: string }) {
  const { documents, getRelationships } = useListRelationships()

  useEffect(() => {
    getRelationships([{ relationTo: 'posts', value: 'post-1' }])
  }, [getRelationships])

  const document = documents.posts?.['post-1']
  const title = document && typeof document === 'object' ? String(document.title) : 'loading'

  return (
    <output data-render-key={renderKey} role="status">
      {title}
    </output>
  )
}
