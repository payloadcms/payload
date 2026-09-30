import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { HydrateHierarchyProvider } from '../../elements/Hierarchy/HydrateProvider/index.js'
import type { HierarchyInitialData } from './types.js'

import { BranchProvider, useBranch } from '../Branch/index.js'
import { HierarchyProvider, useHierarchy } from './index.js'

const config = vi.hoisted(() => ({
  branching: { enabled: true },
  routes: { admin: '/admin', api: '/api' },
  serverURL: 'http://localhost:3000',
}))

vi.mock('../Config/index.js', () => ({
  useConfig: () => ({ config }),
}))

vi.mock('../DocumentEvents/index.js', () => ({
  useDocumentEvents: () => ({ mostRecentUpdate: null }),
}))

vi.mock('../Preferences/index.js', () => ({
  usePreferences: () => ({ setPreference: vi.fn() }),
}))

vi.mock('../RouterAdapter/index.js', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('../RouteTransition/index.js', () => ({
  useRouteTransition: () => ({ startRouteTransition: (callback: () => void) => callback() }),
}))

const mainTreeData: HierarchyInitialData = {
  docs: [{ id: 'folder-1', title: 'main' }],
  loadedParents: {},
}

const featureTreeData: HierarchyInitialData = {
  docs: [{ id: 'folder-1', title: 'feature' }],
  loadedParents: {},
}

test('should keep hierarchy data separate when the nested provider receives another branch', async () => {
  const screen = await render(
    <BranchHierarchyFixture activeBranch="main" treeData={mainTreeData} />,
  )

  await expect.element(screen.getByTestId('tree-data')).toHaveTextContent('main')

  await screen.rerender(<BranchHierarchyFixture activeBranch="feature" treeData={mainTreeData} />)
  await expect.element(screen.getByTestId('active-branch')).toHaveTextContent('feature')
  await expect.element(screen.getByTestId('tree-data')).toHaveTextContent('empty')

  await screen.rerender(
    <BranchHierarchyFixture activeBranch="feature" treeData={featureTreeData} />,
  )
  await expect.element(screen.getByTestId('tree-data')).toHaveTextContent('feature')

  await screen.rerender(<BranchHierarchyFixture activeBranch="main" treeData={featureTreeData} />)
  await expect.element(screen.getByTestId('active-branch')).toHaveTextContent('main')
  await expect.element(screen.getByTestId('tree-data')).toHaveTextContent('main')
})

function BranchHierarchyFixture({
  activeBranch,
  treeData,
}: {
  activeBranch: string
  treeData: HierarchyInitialData
}) {
  return (
    <BranchProvider activeBranch={activeBranch} branches={[]}>
      <HierarchyProvider>
        <HydrateHierarchyProvider collectionSlug="folders" treeData={treeData} />
        <HierarchyConsumer />
      </HierarchyProvider>
    </BranchProvider>
  )
}

function HierarchyConsumer() {
  const { activeBranch } = useBranch()
  const { getTreeDataForCollection } = useHierarchy()
  const treeData = getTreeDataForCollection('folders')

  return (
    <div>
      <output data-testid="active-branch">{activeBranch}</output>
      <output data-testid="tree-data">{String(treeData?.docs[0]?.title ?? 'empty')}</output>
    </div>
  )
}
