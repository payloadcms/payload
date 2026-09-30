import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { RelationshipFilter } from './index.js'

const collection = vi.hoisted(() => ({
  admin: { useAsTitle: 'title' },
  labels: { plural: 'Posts', singular: 'Post' },
  slug: 'posts',
}))
const i18n = vi.hoisted(() => ({ language: 'en', t: (key: string) => key }))

vi.mock('../../../../hooks/useDebounce.js', () => ({
  useDebounce: (value: unknown) => value,
}))

vi.mock('../../../../providers/Branch/index.js', () => ({
  useBranchParam: () => 'feature-branch',
}))

vi.mock('../../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: { routes: { api: '/api' } },
    getEntityConfig: () => collection,
  }),
}))

vi.mock('../../../../providers/Locale/index.js', () => ({
  useLocale: () => null,
}))

vi.mock('../../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n, t: i18n.t }),
}))

vi.mock('../../../ReactSelect/index.js', () => ({
  ReactSelect: () => <div data-testid="react-select" />,
}))

beforeEach(() => {
  vi.stubGlobal('process', { env: {} })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/posts/post-1?')) {
        return { json: async () => ({ id: 'post-1', title: 'Post' }), ok: true }
      }

      return {
        json: async () => ({ docs: [], nextPage: null }),
        ok: true,
      }
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('should fetch a selected relationship option from the active branch', async () => {
  await render(
    <RelationshipFilter
      disabled={false}
      field={{ admin: {}, hasMany: false, relationTo: 'posts', type: 'relationship' } as never}
      filterOptions={{}}
      onChange={vi.fn()}
      operator="equals"
      value="post-1"
    />,
  )

  await expect
    .poll(() => vi.mocked(fetch).mock.calls.find(([input]) => String(input).includes('/post-1?')))
    .toBeTruthy()

  const selectedDocumentRequest = vi
    .mocked(fetch)
    .mock.calls.find(([input]) => String(input).includes('/post-1?'))
  const requestURL = new URL(String(selectedDocumentRequest?.[0]), window.location.origin)

  expect(requestURL.searchParams.get('branch')).toBe('feature-branch')
})
