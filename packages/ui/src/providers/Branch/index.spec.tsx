import { branchesCollectionSlug } from 'payload/shared'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Link } from '../../elements/Link/index.js'
import { PayloadLink, RouterAdapterContext, useRouter } from '../RouterAdapter/index.js'

import { BranchProvider, useBranch, useBranchParam } from './index.js'

const state = vi.hoisted(() => ({
  mostRecentUpdate: undefined as
    | { doc: { slug: string }; entitySlug: string; operation: string }
    | undefined,
  error: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  replaceState: vi.fn(),
  refresh: vi.fn(),
  setPreference: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('sonner', () => ({ toast: { error: state.error } }))
vi.mock('../Translation/index.js', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

vi.mock('../Config/index.js', () => ({
  useConfig: () => ({ config: { branching: { enabled: true }, routes: { admin: '/admin' } } }),
}))
vi.mock('../DocumentEvents/index.js', () => ({
  useDocumentEvents: () => ({ mostRecentUpdate: state.mostRecentUpdate }),
}))
vi.mock('../Preferences/index.js', () => ({
  usePreferences: () => ({ setPreference: state.setPreference }),
}))
vi.mock('../RouteTransition/index.js', () => ({
  useRouteTransition: () => ({ startRouteTransition: (callback: () => void) => callback() }),
}))

const originalURL = window.location.href

afterEach(() => window.history.replaceState(null, '', originalURL))

beforeEach(() => {
  window.history.replaceState(null, '', '/admin/collections/posts?locale=fr#details')
  state.mostRecentUpdate = undefined
  vi.clearAllMocks()
  state.setPreference.mockResolvedValue(undefined)
})

test('should replace an optimistic selection when the server branch changes', async () => {
  const screen = await render(<Fixture activeBranch="main" />)

  await screen.getByRole('button', { name: 'Switch branch' }).click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('selected')

  await screen.rerender(<Fixture activeBranch="server-branch" />)

  await expect.element(screen.getByRole('status')).toHaveTextContent('server-branch')
})

test('should select and persist a created branch without refreshing', async () => {
  const screen = await render(<Fixture activeBranch="main" />)

  state.mostRecentUpdate = {
    doc: { slug: 'created-branch' },
    entitySlug: branchesCollectionSlug,
    operation: 'create',
  }
  await screen.rerender(<Fixture activeBranch="main" />)

  await expect.element(screen.getByRole('status')).toHaveTextContent('created-branch')
  expect(state.setPreference).toHaveBeenCalledWith('nav', { branch: 'created-branch' }, true)
  expect(state.refresh).not.toHaveBeenCalled()
  await vi.waitFor(() =>
    expect(state.replace).toHaveBeenCalledWith(
      '/admin/collections/posts?locale=fr&branch=created-branch#details',
      { scroll: false },
    ),
  )

  await screen.rerender(<Fixture activeBranch="another-branch" />)
  expect(state.setPreference).toHaveBeenCalledTimes(1)
})

function Fixture({ activeBranch }: { activeBranch: string }) {
  return (
    <RouterAdapterContext
      value={{
        Link: (props) => <a {...props} />,
        params: {},
        pathname: '/admin/collections/posts',
        router: {
          back: vi.fn(),
          push: state.push,
          refresh: state.refresh,
          replace: state.replace,
          replaceState: state.replaceState,
        },
        searchParams: new URLSearchParams(window.location.search),
      }}
    >
      <BranchProvider activeBranch={activeBranch} branches={[]}>
        <Consumer />
      </BranchProvider>
    </RouterAdapterContext>
  )
}

function Consumer() {
  const router = useRouter()
  const requestBranch = useBranchParam()
  const { activeBranch, setBranch } = useBranch()

  return (
    <>
      <div role="status">{activeBranch}</div>
      <span data-testid="request-branch">{requestBranch ?? 'main'}</span>
      <Link href="/admin/collections/posts/123?locale=fr#title">Open document</Link>
      <PayloadLink href="/admin/collections/pages" target="_blank">
        Open pages
      </PayloadLink>
      <button onClick={() => router.replace('?page=2')} type="button">
        Next page
      </button>
      <button onClick={() => router.replaceState('?limit=20')} type="button">
        Sync list query
      </button>
      <button onClick={() => setBranch('main')} type="button">
        Switch to main
      </button>
      <button onClick={() => setBranch('selected')} type="button">
        Switch branch
      </button>
    </>
  )
}

test('should restore the rendered branch and report a failed preference write', async () => {
  state.setPreference.mockRejectedValueOnce(new Error('Network unavailable'))
  const screen = await render(<Fixture activeBranch="main" />)

  await screen.getByRole('button', { name: 'Switch branch' }).click()

  await expect.element(screen.getByRole('status')).toHaveTextContent('main')
  expect(state.error).toHaveBeenCalledWith('error:unspecific')
  expect(state.refresh).not.toHaveBeenCalled()
})

test('should keep requests on the rendered branch until the refreshed server context arrives', async () => {
  let finishWrite: () => void
  state.setPreference.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finishWrite = resolve
      }),
  )
  const screen = await render(<Fixture activeBranch="original" />)

  await screen.getByRole('button', { name: 'Switch branch' }).click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('selected')
  await expect.element(screen.getByTestId('request-branch')).toHaveTextContent('original')

  finishWrite()
  await vi.waitFor(() => expect(state.push).toHaveBeenCalledOnce())
  await expect.element(screen.getByTestId('request-branch')).toHaveTextContent('original')

  await screen.rerender(<Fixture activeBranch="selected" />)
  await expect.element(screen.getByTestId('request-branch')).toHaveTextContent('selected')
})

test('should include the branch in link destinations and client navigation', async () => {
  const screen = await render(<Fixture activeBranch="campaign" />)
  const documentLink = screen.getByRole('link', { name: 'Open document' })

  await expect
    .element(documentLink)
    .toHaveAttribute('href', '/admin/collections/posts/123?locale=fr&branch=campaign#title')
  await expect
    .element(screen.getByRole('link', { name: 'Open pages' }))
    .toHaveAttribute('href', '/admin/collections/pages?branch=campaign')
  await documentLink.click()

  expect(state.push).toHaveBeenCalledWith(
    '/admin/collections/posts/123?locale=fr&branch=campaign#title',
    { scroll: undefined },
  )
})

test('should navigate to the selected branch while preserving the current query and fragment', async () => {
  const screen = await render(<Fixture activeBranch="main" />)

  await screen.getByRole('button', { name: 'Switch branch' }).click()
  await vi.waitFor(() =>
    expect(state.push).toHaveBeenCalledWith(
      '/admin/collections/posts?locale=fr&branch=selected#details',
      { scroll: false },
    ),
  )
})

test('should remove the branch parameter when switching to main', async () => {
  window.history.replaceState(
    null,
    '',
    '/admin/collections/posts?branch=campaign&locale=fr#details',
  )
  const screen = await render(<Fixture activeBranch="campaign" />)

  await screen.getByRole('button', { name: 'Switch to main' }).click()
  await vi.waitFor(() =>
    expect(state.push).toHaveBeenCalledWith('/admin/collections/posts?locale=fr#details', {
      scroll: false,
    }),
  )

  await screen.rerender(<Fixture activeBranch="main" />)
  await expect
    .element(screen.getByRole('link', { name: 'Open document' }))
    .toHaveAttribute('href', '/admin/collections/posts/123?locale=fr#title')
})

test('should preserve the branch when replacing list queries and synchronizing history', async () => {
  const screen = await render(<Fixture activeBranch="campaign" />)

  await screen.getByRole('button', { name: 'Next page' }).click()
  expect(state.replace).toHaveBeenCalledWith(
    '/admin/collections/posts?page=2&branch=campaign',
    undefined,
  )

  await screen.getByRole('button', { name: 'Sync list query' }).click()
  expect(state.replaceState).toHaveBeenCalledWith(
    '/admin/collections/posts?limit=20&branch=campaign',
  )
})
