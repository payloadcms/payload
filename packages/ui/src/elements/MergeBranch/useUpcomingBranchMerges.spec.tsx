import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { useUpcomingBranchMerges } from './useUpcomingBranchMerges.js'

const serverFunction = vi.hoisted(() => vi.fn())

vi.mock('../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction }),
}))

function Upcoming({ branchID, isOpen }: { branchID: string; isOpen: boolean }) {
  const { clearUpcoming, upcoming } = useUpcomingBranchMerges({
    branchID,
    isOpen,
    mode: 'schedule',
  })

  return (
    <>
      <output>{upcoming.map(({ id }) => id).join(',') || 'empty'}</output>
      <button onClick={clearUpcoming} type="button">
        Clear
      </button>
    </>
  )
}

test('should ignore an old branch response after closing and opening another branch', async () => {
  let resolveA!: (jobs: { id: string; waitUntil: string }[]) => void
  serverFunction.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveA = resolve
    }),
  )
  serverFunction.mockResolvedValueOnce([{ id: 'job-b', waitUntil: '2030-01-01' }])
  const screen = await render(<Upcoming branchID="a" isOpen />)

  await screen.rerender(<Upcoming branchID="a" isOpen={false} />)
  await screen.rerender(<Upcoming branchID="b" isOpen />)
  await expect.element(screen.getByRole('status')).toHaveTextContent('job-b')
  resolveA([{ id: 'job-a', waitUntil: '2030-01-01' }])
  await expect.element(screen.getByRole('status')).toHaveTextContent('job-b')
})

test('should invalidate a pending response when explicitly cleared', async () => {
  let resolveJobs!: (jobs: { id: string; waitUntil: string }[]) => void
  serverFunction.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveJobs = resolve
    }),
  )
  const screen = await render(<Upcoming branchID="a" isOpen />)

  await screen.getByRole('button', { name: 'Clear' }).click()
  resolveJobs([{ id: 'job-a', waitUntil: '2030-01-01' }])

  await expect.element(screen.getByRole('status')).toHaveTextContent('empty')
})
