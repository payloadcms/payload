import React, { useEffect } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { RelationshipProvider, useListRelationships } from './index.js'

vi.mock('payload/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('payload/shared')>()),
  // the original reads `process.env.NEXT_BASE_PATH`, which Next.js inlines and the browser lacks
  formatAdminURL: ({ apiRoute, path }: { apiRoute: string; path: string }) => `${apiRoute}${path}`,
}))

vi.mock('../../../providers/Config/index.js', () => {
  const config = {
    collections: [{ slug: 'posts', admin: { useAsTitle: 'title' } }],
    routes: { api: '/api' },
  }

  return { useConfig: () => ({ config }) }
})

vi.mock('../../../providers/Locale/index.js', () => ({
  useLocale: () => undefined,
}))

vi.mock('../../../providers/Translation/index.js', () => {
  const i18n = { language: 'en' }

  return { useTranslation: () => ({ i18n }) }
})

const Cell: React.FC<{ readonly id: string }> = ({ id }) => {
  const { documents, getRelationships } = useListRelationships()

  useEffect(() => {
    getRelationships([{ relationTo: 'posts', value: id }])
  }, [getRelationships, id])

  const doc = documents.posts?.[id] as { title: string } | false | null | undefined

  return <p>{doc ? doc.title : 'Loading'}</p>
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// One cell requests post 1, whose batch is held; a second cell asks for it while the batch is
// pending and is left to that batch.
const renderWithPendingBatch = async (afterBatch: () => Promise<Response>) => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const batch = Promise.withResolvers<Response>()
  const fetchMock = vi
    .spyOn(window, 'fetch')
    .mockImplementationOnce(() => batch.promise)
    .mockImplementation(afterBatch)

  const screen = await render(
    <RelationshipProvider>
      <Cell id="1" />
    </RelationshipProvider>,
  )
  await expect.poll(() => fetchMock.mock.calls.length).toBe(1)

  await screen.rerender(
    <RelationshipProvider>
      <Cell id="1" />
      <Cell id="1" />
    </RelationshipProvider>,
  )
  // the provider's debounced loader (100 ms) has run again and skipped the pending ID
  await wait(300)
  expect(fetchMock).toHaveBeenCalledTimes(1)

  return { batch, fetchMock, screen }
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('should request a document again when its batch throws after another cell asked for it', async () => {
  const { batch, fetchMock, screen } = await renderWithPendingBatch(() =>
    Promise.resolve(Response.json({ docs: [{ id: '1', title: 'Post 1' }] })),
  )

  batch.reject(new TypeError('Failed to fetch'))

  await expect.poll(() => fetchMock.mock.calls.length).toBe(2)
  expect(String(fetchMock.mock.calls[1]?.[0])).toContain('where%5Bid%5D%5Bin%5D=1')
  await expect.poll(() => screen.getByText('Post 1').elements()).toHaveLength(2)
})

test('should not request it a third time when the second request also throws after another cell asked for it', async () => {
  const second = Promise.withResolvers<Response>()
  const { batch, fetchMock, screen } = await renderWithPendingBatch(() => second.promise)

  batch.reject(new TypeError('Failed to fetch'))
  await expect.poll(() => fetchMock.mock.calls.length).toBe(2)

  // a third cell asks for it while the second request is pending and is left to that request
  await screen.rerender(
    <RelationshipProvider>
      <Cell id="1" />
      <Cell id="1" />
      <Cell id="1" />
    </RelationshipProvider>,
  )
  await wait(300)
  expect(fetchMock).toHaveBeenCalledTimes(2)

  second.reject(new TypeError('Failed to fetch'))

  await wait(500)
  expect(fetchMock).toHaveBeenCalledTimes(2)
})
