import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ScheduledMerges } from './index.js'

const { serverFunction, toast, closeModal, refresh } = vi.hoisted(() => ({
  closeModal: vi.fn(),
  refresh: vi.fn(),
  serverFunction: vi.fn(),
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('sonner', () => ({ toast }))
vi.mock('../../../elements/Modal/index.js', () => ({
  useModal: () => ({ closeModal, openModal: vi.fn() }),
}))
vi.mock('../../../providers/RouterAdapter/index.js', () => ({ useRouter: () => ({ refresh }) }))
vi.mock('../../../providers/RouteTransition/index.js', () => ({
  useRouteTransition: () => ({ startRouteTransition: (callback: () => void) => callback() }),
}))
vi.mock('../../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction }),
}))
vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('../../../elements/Button/index.js', () => ({
  Button: ({ children, disabled, onClick }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button disabled={disabled} onClick={onClick} type="button">
      {children}
    </button>
  ),
}))
vi.mock('../../../elements/Dialog/index.js', () => ({
  DialogModal: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: () => null,
  DialogBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../../../elements/Pill/index.js', () => ({ Pill: () => null }))
vi.mock('../../../elements/ChangeSummary/index.js', () => ({ ChangeSummary: () => null }))
vi.mock('../ChangedDocuments/index.js', () => ({ ChangedDocuments: () => null }))

beforeEach(() => vi.clearAllMocks())

const schedules = [
  {
    id: 'job',
    waitUntil: '2030-01-01T00:00:00Z',
    changes: [],
    closeBranch: false,
    isEverything: true,
  },
]

test('should keep cancellation available when the server refuses it', async () => {
  serverFunction.mockResolvedValue({ error: 'Cancellation forbidden' })
  const screen = await render(
    <ScheduledMerges branchID="campaign" branchSlug="campaign" schedules={schedules} />,
  )

  await screen.getByRole('button', { name: 'branching:cancelSchedule' }).click()

  await expect.poll(() => toast.error.mock.calls).toEqual([['Cancellation forbidden']])
  expect(toast.success).not.toHaveBeenCalled()
  expect(closeModal).not.toHaveBeenCalled()
  expect(refresh).not.toHaveBeenCalled()
  await expect
    .element(screen.getByRole('button', { name: 'branching:cancelSchedule' }))
    .toBeEnabled()
})

test('should close and refresh only after successful cancellation', async () => {
  serverFunction.mockResolvedValue({ message: 'Success' })
  const screen = await render(
    <ScheduledMerges branchID="campaign" branchSlug="campaign" schedules={schedules} />,
  )

  await screen.getByRole('button', { name: 'branching:cancelSchedule' }).click()

  await expect.poll(() => toast.success.mock.calls).toEqual([['branching:scheduleCancelled']])
  expect(closeModal).toHaveBeenCalledWith('scheduled-merges-campaign')
  expect(refresh).toHaveBeenCalledOnce()
})
