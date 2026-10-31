import type { ReactNode } from 'react'

import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { BranchChanges } from './index.js'

vi.mock('../../../elements/Gutter/index.js', () => ({
  Gutter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../../../elements/Link/index.js', () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))
vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('../ChangedDocuments/index.js', () => ({ ChangedDocuments: () => null }))
vi.mock('../DiscardChangesButton/index.js', () => ({ DiscardChangesButton: () => null }))
vi.mock('../MergeChangesButton/index.js', () => ({ MergeChangesButton: () => null }))
vi.mock('../MergeLedger/index.js', () => ({ MergeLedger: () => null }))
vi.mock('../ScheduledMerges/index.js', () => ({ ScheduledMerges: () => null }))

test.each([1, 3])(
  'should render only valid history destinations on page %i',
  async (historyPage) => {
    const screen = await render(
      <BranchChanges
        branchID="id"
        branchName="Campaign"
        branchSlug="campaign"
        changes={[]}
        historyPage={historyPage}
        historyTotalPages={3}
        mergeEvents={[{ id: 'merge', mergedAt: '2030-01-01', changes: [] }]}
      />,
    )
    const disabledLabel = historyPage === 1 ? 'general:previous' : 'general:next'
    const enabledLabel = historyPage === 1 ? 'general:next' : 'general:previous'

    await expect.element(screen.getByRole('link', { name: disabledLabel })).not.toBeInTheDocument()
    await expect.element(screen.getByText(disabledLabel)).toHaveAttribute('aria-disabled', 'true')
    await expect
      .element(screen.getByRole('link', { name: enabledLabel }))
      .toHaveAttribute('href', `?historyPage=${2}`)
  },
)
