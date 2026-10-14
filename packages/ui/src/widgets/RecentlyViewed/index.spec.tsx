import type { ComponentProps } from 'react'

import { beforeEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import type { DocumentsPage } from './getDocuments.js'
import type { PinDocumentPicker } from './PinDocumentPicker/index.js'

import { RouterAdapterContext } from '../../providers/RouterAdapter/index.js'
import { RecentsAndPinnedClient } from './index.client.js'

const { serverFunction, updatePinnedPreferences } = vi.hoisted(() => ({
  serverFunction: vi.fn(),
  updatePinnedPreferences: vi.fn(),
}))

vi.mock('../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction }),
}))

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    t: (
      _key: string,
      { currentPage, totalPages }: { currentPage?: number; totalPages?: number } = {},
    ) => `${currentPage} of ${totalPages}`,
  }),
}))

vi.mock('./pinnedPreferences.js', () => ({ updatePinnedPreferences }))

// Exercise the widget's save callback without opening the document-picker drawer.
vi.mock('./PinDocumentPicker/index.js', () => ({
  PinDocumentPicker: ({ isDisabled, onSelect }: ComponentProps<typeof PinDocumentPicker>) => (
    <button
      disabled={isDisabled}
      onClick={() => onSelect({ document: { id: 'new', collectionSlug: 'posts' } })}
      type="button"
    >
      Add pin
    </button>
  ),
}))

type Props = ComponentProps<typeof RecentsAndPinnedClient>

const labels: Props['labels'] = {
  addPin: 'Add pin',
  loadError: 'Unable to load documents',
  loading: 'Loading',
  next: 'Next',
  pagination: 'Pagination',
  pinned: 'Pinned',
  pinnedEmpty: 'No pins',
  pinnedEmptyDescription: 'Pin a document',
  pinnedSaveError: 'Unable to save pins',
  previous: 'Previous',
  recents: 'Recently viewed',
  recentsEmpty: 'No recent documents',
  recentsEmptyDescription: 'Visit a document',
  removePin: 'Remove pin',
  retry: 'Retry',
  title: 'Activity',
}

beforeEach(() => {
  vi.resetAllMocks()
  updatePinnedPreferences.mockResolvedValue(undefined)
})

test('should replace cached documents when the server sends new initial pages', async () => {
  const initialPages = { pinned: documentsPage({ title: 'English title' }) }
  const screen = await render(<Widget initialPages={initialPages} />)

  await expect.element(screen.getByRole('link', { name: 'English title' })).toBeVisible()
  await screen.rerender(
    <Widget initialPages={{ pinned: documentsPage({ title: 'Título en español' }) }} />,
  )

  await expect.element(screen.getByRole('link', { name: 'Título en español' })).toBeVisible()
  await expect.element(screen.getByRole('link', { name: 'English title' })).not.toBeInTheDocument()
  expect(serverFunction).not.toHaveBeenCalled()
})

test('should refetch after a saved pin fails to reload, even when its old batch is cached', async () => {
  serverFunction
    .mockRejectedValueOnce(new Error('Network failure'))
    .mockResolvedValueOnce(documentsPage({ title: 'New pin' }))
  const screen = await render(
    <Widget initialPages={{ pinned: documentsPage({ title: 'Old pin' }) }} />,
  )

  await screen.getByRole('button', { name: 'Add pin', exact: true }).click()
  await expect.element(screen.getByRole('button', { name: 'Retry' })).toBeVisible()
  screen.getByRole('button', { name: 'Retry' }).element().focus()
  await userEvent.keyboard('{Enter}')

  await expect.element(screen.getByRole('link', { name: 'New pin' })).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Pinned', exact: true })).toHaveFocus()
  expect(serverFunction).toHaveBeenCalledTimes(2)
})

test('should ignore an old reload that resolves after new server data arrives', async () => {
  let resolveReload: (page: DocumentsPage) => void = () => {}
  serverFunction.mockImplementationOnce(
    () => new Promise<DocumentsPage>((resolve) => (resolveReload = resolve)),
  )
  const screen = await render(
    <Widget initialPages={{ pinned: documentsPage({ title: 'Old pin' }) }} />,
  )

  await screen.getByRole('button', { name: 'Add pin', exact: true }).click()
  await expect.poll(() => serverFunction.mock.calls.length).toBe(1)
  await screen.rerender(
    <Widget initialPages={{ pinned: documentsPage({ title: 'Refreshed pin' }) }} />,
  )
  resolveReload(documentsPage({ title: 'Superseded pin' }))

  await expect.element(screen.getByRole('link', { name: 'Refreshed pin' })).toBeVisible()
  await expect.element(screen.getByRole('link', { name: 'Superseded pin' })).not.toBeInTheDocument()
  await expect.element(screen.getByRole('button', { name: 'Add pin', exact: true })).toBeEnabled()
  expect(serverFunction).toHaveBeenCalledOnce()
})

test('should reuse valid cached tabs without fetching', async () => {
  const screen = await render(
    <Widget
      initialPages={{
        pinned: documentsPage({ title: 'Pinned document' }),
        recents: documentsPage({ title: 'Recent document' }),
      }}
    />,
  )

  await screen.getByRole('button', { name: 'Recently viewed', exact: true }).click()
  await expect.element(screen.getByRole('link', { name: 'Recent document' })).toBeVisible()
  await screen.getByRole('button', { name: 'Pinned', exact: true }).click()
  await expect.element(screen.getByRole('link', { name: 'Pinned document' })).toBeVisible()
  expect(serverFunction).not.toHaveBeenCalled()
})

test('should keep a saved pin invalidated when switching tabs supersedes its reload', async () => {
  let resolveReload: (page: DocumentsPage) => void = () => {}
  serverFunction
    .mockImplementationOnce(
      () => new Promise<DocumentsPage>((resolve) => (resolveReload = resolve)),
    )
    .mockResolvedValueOnce(documentsPage({ title: 'New pin' }))
  const screen = await render(
    <Widget
      initialPages={{
        pinned: documentsPage({ title: 'Old pin' }),
        recents: documentsPage({ title: 'Recent document' }),
      }}
    />,
  )

  await screen.getByRole('button', { name: 'Add pin', exact: true }).click()
  await expect.poll(() => serverFunction.mock.calls.length).toBe(1)
  await screen.getByRole('button', { name: 'Recently viewed', exact: true }).click()
  await screen.getByRole('button', { name: 'Pinned', exact: true }).click()
  resolveReload(documentsPage({ title: 'Superseded pin' }))

  await expect.element(screen.getByRole('link', { name: 'New pin' })).toBeVisible()
  expect(serverFunction).toHaveBeenCalledTimes(2)
})

function Widget({ initialPages }: Pick<Props, 'initialPages'>) {
  return (
    <RouterAdapterContext
      value={{
        Link: ({ href, ...props }) => <a href={href} {...props} />,
        params: {},
        pathname: '/',
        router: { back: vi.fn(), push: vi.fn(), refresh: vi.fn(), replace: vi.fn() },
        searchParams: new URLSearchParams(),
      }}
    >
      <RecentsAndPinnedClient
        initialPages={initialPages}
        labels={labels}
        pinnableCollections={['posts']}
        pinsURL="/api/payload-preferences/pinned-documents"
      />
    </RouterAdapterContext>
  )
}

function documentsPage({ title }: { title: string }): DocumentsPage {
  return {
    items: [
      { id: title, collectionSlug: 'posts', href: `/posts/${title}`, title, typeLabel: 'Posts' },
    ],
    page: 1,
    totalDocs: 1,
  }
}
