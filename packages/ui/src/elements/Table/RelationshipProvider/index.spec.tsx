import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

const fetchedURLs: string[] = []

vi.mock('payload/shared', () => ({
  appendUploadSelectFields: () => {},
  formatAdminURL: ({ path }: { path: string }) => path,
}))

vi.mock('../../../hooks/useDebounce.js', () => ({
  useDebounce: <T,>(value: T) => value,
}))

vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: {
      collections: [{ admin: { useAsTitle: 'title' }, slug: 'organizations' }],
      routes: { api: '/api' },
    },
  }),
}))

vi.mock('../../../providers/Locale/index.js', () => ({
  useLocale: () => ({ code: 'en' }),
}))

vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}))

import React from 'react'

import { RelationshipProvider, useListRelationships } from './index.js'

const RequestOnMount: React.FC<{ count: number }> = ({ count }) => {
  const { getRelationships } = useListRelationships()
  React.useEffect(() => {
    getRelationships(
      Array.from({ length: count }, (_, i) => ({ relationTo: 'organizations', value: i + 1 })),
    )
  }, [count, getRelationships])
  return null
}

const idsIn = (url: string): number => {
  const params = new URLSearchParams(url.split('?')[1])
  return params.get('where[id][in]')!.split(',').length
}

test('a page of cells asks for more documents than one request may carry', async () => {
  fetchedURLs.length = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      fetchedURLs.push(url)
      return { json: async () => ({ docs: [] }), ok: true }
    }),
  )

  await render(
    <RelationshipProvider>
      <RequestOnMount count={300} />
    </RelationshipProvider>,
  )

  await vi.waitFor(() => {
    const total = fetchedURLs.reduce((sum, url) => sum + idsIn(url), 0)
    expect(total).toBe(300)
  })

  // The provider reads 250 documents per request, so 300 values need two. One
  // request would leave the last 50 stored as missing and shown as untitled.
  expect(fetchedURLs.length).toBe(2)
  fetchedURLs.forEach((url) => expect(idsIn(url)).toBeLessThanOrEqual(250))

  vi.unstubAllGlobals()
})
