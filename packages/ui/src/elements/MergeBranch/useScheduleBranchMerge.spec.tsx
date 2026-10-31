import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { useScheduleBranchMerge } from './useScheduleBranchMerge.js'

const { loadUpcoming, serverFunction, toast } = vi.hoisted(() => ({
  loadUpcoming: vi.fn(),
  serverFunction: vi.fn(),
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('sonner', () => ({ toast }))
vi.mock('../../providers/RouterAdapter/index.js', () => ({ useRouter: () => ({}) }))
vi.mock('../../providers/RouteTransition/index.js', () => ({ useRouteTransition: () => ({}) }))
vi.mock('../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction }),
}))
vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

function CancelSchedule() {
  const { cancelScheduledMerge, isScheduling } = useScheduleBranchMerge({
    canCloseBranch: false,
    closeBranch: false,
    dismiss: vi.fn(),
    loadUpcoming,
    target: null,
  })

  return (
    <button disabled={isScheduling} onClick={() => void cancelScheduledMerge('job')} type="button">
      Cancel schedule
    </button>
  )
}

beforeEach(() => vi.clearAllMocks())

test('should report a rejected cancellation without refreshing or reporting success', async () => {
  serverFunction.mockResolvedValue({ error: 'Cancellation forbidden' })
  const screen = await render(<CancelSchedule />)

  await screen.getByRole('button').click()

  await expect.poll(() => toast.error.mock.calls).toEqual([['Cancellation forbidden']])
  expect(toast.success).not.toHaveBeenCalled()
  expect(loadUpcoming).not.toHaveBeenCalled()
  await expect.element(screen.getByRole('button')).toBeEnabled()
})

test('should refresh upcoming merges after a successful cancellation', async () => {
  serverFunction.mockResolvedValue({ message: 'Success' })
  const screen = await render(<CancelSchedule />)

  await screen.getByRole('button').click()

  await expect.poll(() => toast.success.mock.calls).toEqual([['general:deletedSuccessfully']])
  expect(loadUpcoming).toHaveBeenCalledOnce()
  expect(toast.error).not.toHaveBeenCalled()
})
