import type { HTMLAttributes, ReactNode } from 'react'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ChangedDocuments } from './index.js'

const serverFunction = vi.hoisted(() => vi.fn())

vi.mock('../../../elements/Pill/index.js', () => ({
  Pill: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))
vi.mock('../../../elements/ShimmerEffect/index.js', () => ({
  ShimmerEffect: (props: HTMLAttributes<HTMLSpanElement>) => (
    <span data-testid="shimmer" {...props}>
      Loading placeholder
    </span>
  ),
}))
vi.mock('../../../fields/Checkbox/Input.js', () => ({ CheckboxInput: () => null }))
vi.mock('../../../icons/Chevron/index.js', () => ({ ChevronIcon: () => null }))
vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    getEntityConfig: () => ({ labels: { singular: 'Post' } }),
  }),
}))
vi.mock('../../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction }),
}))
vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) =>
      ({
        'branching:changedDocuments': 'Changed documents',
        'branching:operation_update': 'Updated',
        'error:unknown': 'An unknown error has occurred.',
        'general:loading': 'Loading',
      })[key] ?? key,
  }),
}))

class IdleIntersectionObserver {
  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', IdleIntersectionObserver)
})

afterEach(() => {
  serverFunction.mockReset()
  vi.unstubAllGlobals()
})

test('should connect the toggle to the diff panel and expose loading status', async () => {
  serverFunction.mockReturnValue(new Promise(() => undefined))
  const screen = await render(
    <ChangedDocuments
      branch="campaign"
      changes={[
        {
          collectionSlug: 'posts',
          docID: 'document-id',
          id: 'change-id',
          operation: 'update',
        },
      ]}
    />,
  )
  const toggle = screen.getByRole('button', { name: 'document-id' })

  await toggle.click()

  const panel = screen.getByRole('region', { name: 'document-id' })

  await expect.element(toggle).toHaveAttribute('aria-controls', 'changed-docs-change-id-diff')
  await expect.element(panel).toHaveAttribute('id', 'changed-docs-change-id-diff')
  await expect.element(screen.getByRole('status')).toHaveTextContent('Loading')
  await expect.element(screen.getByTestId('shimmer')).toHaveAttribute('aria-hidden', 'true')
})

test('should announce a diff loading error', async () => {
  serverFunction.mockRejectedValue(new Error('Failed to load diff'))
  const screen = await render(
    <ChangedDocuments
      branch="campaign"
      changes={[
        {
          collectionSlug: 'posts',
          docID: 'document-id',
          id: 'change-id',
          operation: 'update',
        },
      ]}
    />,
  )

  await screen.getByRole('button', { name: 'document-id' }).click()

  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('An unknown error has occurred.')
})
