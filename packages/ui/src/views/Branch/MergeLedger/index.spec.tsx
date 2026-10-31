import type { ReactNode } from 'react'

import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { MergeLedger } from './index.js'

const serverFunction = vi.hoisted(() => vi.fn())

vi.mock('payload/shared', () => ({ formatAdminURL: ({ path }: { path: string }) => path }))

vi.mock('../../../elements/Pill/index.js', () => ({
  Pill: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))
vi.mock('../../../elements/Link/index.js', () => ({
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))
vi.mock('../../../elements/ShimmerEffect/index.js', () => ({ ShimmerEffect: () => null }))
vi.mock('../../../icons/Chevron/index.js', () => ({ ChevronIcon: () => null }))
vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: {
      admin: { dateFormat: 'yyyy-MM-dd HH:mm', timezones: { defaultTimezone: 'America/New_York' } },
      routes: { admin: '/admin' },
    },
    getEntityConfig: () => ({ labels: { singular: 'Post' } }),
  }),
}))
vi.mock('../../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction }),
}))
vi.mock('../../../providers/Translation/index.js', async () => {
  const { enUS } = await import('date-fns/locale/en-US')

  return {
    useTranslation: () => ({
      i18n: { language: 'en', dateFNS: enUS },
      t: (key: string, values?: { date?: string }) =>
        key === 'branching:mergedOn' ? values?.date : key,
    }),
  }
})

const events = [
  {
    id: 'merge',
    mergedAt: '2030-01-01T01:00:00Z',
    changes: [
      {
        collectionSlug: 'posts',
        docID: 'post',
        docTitle: 'Post title',
        operation: 'update' as const,
      },
    ],
  },
]

beforeEach(() => serverFunction.mockReset())

test('should retry a rejected history diff on re-expansion', async () => {
  serverFunction.mockRejectedValueOnce(new Error('Temporary failure'))
  serverFunction.mockResolvedValueOnce({ status: 'ready', diff: 'Recovered history diff' })
  const screen = await render(<MergeLedger events={events} />)
  const toggle = screen.getByRole('button', { name: 'Post title' })

  await toggle.click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('error:unknown')
  await toggle.click()
  await toggle.click()

  await expect.element(screen.getByText('Recovered history diff')).toBeVisible()
  expect(serverFunction).toHaveBeenCalledTimes(2)
})

test('should preserve an unavailable history result without retrying it', async () => {
  serverFunction.mockResolvedValue({ status: 'unavailable' })
  const screen = await render(<MergeLedger events={events} />)
  const toggle = screen.getByRole('button', { name: 'Post title' })

  await toggle.click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('general:notFound')
  await toggle.click()
  await toggle.click()

  await expect.element(screen.getByRole('status')).toHaveTextContent('general:notFound')
  expect(serverFunction).toHaveBeenCalledTimes(1)
})

test('should format merge times using the admin date format and time zone', async () => {
  const screen = await render(<MergeLedger events={events} />)

  await expect.element(screen.getByRole('heading', { name: '2029-12-31 20:00' })).toBeVisible()
})
