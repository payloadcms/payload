import { branchesCollectionSlug } from 'payload/shared'
import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { BranchProvider, useBranch } from './index.js'

const state = vi.hoisted(() => ({
  mostRecentUpdate: undefined as
    | { doc: { slug: string }; entitySlug: string; operation: string }
    | undefined,
  refresh: vi.fn(),
  setPreference: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../Config/index.js', () => ({
  useConfig: () => ({ config: { branching: { enabled: true } } }),
}))
vi.mock('../DocumentEvents/index.js', () => ({
  useDocumentEvents: () => ({ mostRecentUpdate: state.mostRecentUpdate }),
}))
vi.mock('../Preferences/index.js', () => ({
  usePreferences: () => ({ setPreference: state.setPreference }),
}))
vi.mock('../RouterAdapter/index.js', () => ({
  useRouter: () => ({ refresh: state.refresh }),
}))
vi.mock('../RouteTransition/index.js', () => ({
  useRouteTransition: () => ({ startRouteTransition: (callback: () => void) => callback() }),
}))

beforeEach(() => {
  state.mostRecentUpdate = undefined
  vi.clearAllMocks()
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
})

function Fixture({ activeBranch }: { activeBranch: string }) {
  return (
    <BranchProvider activeBranch={activeBranch} branches={[]}>
      <Consumer />
    </BranchProvider>
  )
}

function Consumer() {
  const { activeBranch, setBranch } = useBranch()

  return (
    <>
      <div role="status">{activeBranch}</div>
      <button onClick={() => setBranch('selected')} type="button">
        Switch branch
      </button>
    </>
  )
}
