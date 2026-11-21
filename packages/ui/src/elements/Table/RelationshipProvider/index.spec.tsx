import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

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

const idsIn = (url: string): number[] => {
  const params = new URLSearchParams(url.split('?')[1])
  return params.get('where[id][in]')!.split(',').map(Number)
}

type Outcome = { loaded: number; missing: number }

// Asks for `count` values once and reports what the provider holds for them:
// how many documents arrived and how many were stored as missing.
const Cells: React.FC<{ count: number; onSettled: (outcome: Outcome) => void }> = ({
  count,
  onSettled,
}) => {
  const { documents, getRelationships } = useListRelationships()
  const organisations = documents['organizations'] ?? {}
  const asked = React.useRef<number[]>([])

  if (asked.current.length === 0) {
    asked.current = Array.from({ length: count }, (_, i) => i + 1)
    getRelationships(asked.current.map((value) => ({ relationTo: 'organizations', value })))
  }

  const ids = asked.current
  const stillWaiting = ids.some(
    (id) => organisations[id] === null || organisations[id] === undefined,
  )
  if (!stillWaiting) {
    const missing = ids.filter((id) => organisations[id] === false).length
    onSettled({ loaded: ids.length - missing, missing })
  }

  return null
}

test('a page of cells asks for more documents than one request may carry', async () => {
  let outcome: Outcome | undefined
  const requests: number[][] = []

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const asked = idsIn(url)
      requests.push(asked)
      // Answer with a document for every id asked for, as the API does.
      const docs = asked.map((id) => ({ id, title: `Organization ${id}` }))
      return { json: async () => ({ docs }), ok: true }
    }),
  )

  try {
    await render(
      <RelationshipProvider>
        <Cells count={300} onSettled={(result) => (outcome = result)} />
      </RelationshipProvider>,
    )

    await vi.waitFor(() => expect(outcome).toBeDefined(), { timeout: 5000 })

    // The provider reads 250 documents per request, so 300 values need two, and
    // neither may carry more than 250.
    expect(requests.length).toBe(2)
    requests.forEach((ids) => expect(ids.length).toBeLessThanOrEqual(250))

    // Every value has to reach a cell. A single request would leave the values
    // past the 250th stored as missing, which a cell shows as untitled.
    expect(outcome).toEqual({ loaded: 300, missing: 0 })
  } finally {
    vi.unstubAllGlobals()
  }
})
