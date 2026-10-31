import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

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
vi.mock('../../../fields/Checkbox/Input.js', () => ({
  CheckboxInput: (props: InputHTMLAttributes<HTMLInputElement>) => (
    <input aria-label={props['aria-label']} type="checkbox" />
  ),
}))
vi.mock('../../../icons/Chevron/index.js', () => ({ ChevronIcon: () => null }))
vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    getEntityConfig: ({ globalSlug }: { globalSlug?: string }) =>
      globalSlug ? { label: 'Site settings' } : { labels: { singular: 'Post' } },
  }),
}))
vi.mock('../../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction }),
}))
vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, values?: { label?: string }) =>
      key === 'general:selectLabel'
        ? `Select ${values?.label}`
        : ({
            'branching:changedDocuments': 'Changed documents',
            'branching:operation_update': 'Updated',
            'error:unknown': 'An unknown error has occurred.',
            'general:loading': 'Loading',
          }[key] ?? key),
  }),
}))

let notifyIntersection: IntersectionObserverCallback

class IdleIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    notifyIntersection = callback
  }
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

test('should share an in-flight diff between prefetch and a simultaneous expansion', async () => {
  serverFunction.mockReturnValue(new Promise(() => undefined))
  const screen = await render(
    <ChangedDocuments
      branch="campaign"
      changes={[
        { collectionSlug: 'posts', docID: 'document-id', id: 'change-id', operation: 'update' },
      ]}
    />,
  )

  notifyIntersection(
    [{ isIntersecting: true }] as IntersectionObserverEntry[],
    {} as IntersectionObserver,
  )
  screen.getByRole('button', { name: 'document-id' }).element().click()

  expect(serverFunction).toHaveBeenCalledTimes(1)
})

test('should label a global row and its controls before its diff loads', async () => {
  serverFunction.mockReturnValue(new Promise(() => undefined))
  const screen = await render(
    <ChangedDocuments
      branch="campaign"
      changes={[{ globalSlug: 'settings', id: 'global-change', operation: 'update' }]}
    />,
  )

  await expect.element(screen.getByRole('button', { name: 'Site settings' })).toBeVisible()
  await expect.element(screen.getByRole('checkbox', { name: 'Select Site settings' })).toBeVisible()
  await expect.element(screen.getByText('undefined', { exact: true })).not.toBeInTheDocument()
})
