import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { useBranchMergeSummary } from './useBranchMergeSummary.js'

const serverFunction = vi.hoisted(() => vi.fn())

vi.mock('../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction }),
}))

function Summary({ branchID, isOpen }: { branchID: string; isOpen: boolean }) {
  const { countedChanges, sampledChanges } = useBranchMergeSummary({ branchID, isOpen })

  return (
    <output>
      {countedChanges ?? 'unknown'}:{sampledChanges?.length ?? 'unknown'}
    </output>
  )
}

test('should forget the previous summary when closed or switched to a failing branch', async () => {
  serverFunction.mockResolvedValueOnce({ docs: [], totalDocs: 0 })
  serverFunction.mockRejectedValue(new Error('Cannot read summary'))
  const screen = await render(<Summary branchID="a" isOpen />)

  await expect.element(screen.getByRole('status')).toHaveTextContent('0:0')
  await screen.rerender(<Summary branchID="b" isOpen />)
  await expect.element(screen.getByRole('status')).toHaveTextContent('unknown:unknown')

  serverFunction.mockResolvedValueOnce({ docs: [], totalDocs: 0 })
  await screen.rerender(<Summary branchID="a" isOpen />)
  await expect.element(screen.getByRole('status')).toHaveTextContent('0:0')
  await screen.rerender(<Summary branchID="a" isOpen={false} />)
  await expect.element(screen.getByRole('status')).toHaveTextContent('unknown:unknown')
})
