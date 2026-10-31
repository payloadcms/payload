import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { MergeBranchModal } from './index.js'

const closeMerge = vi.hoisted(() => vi.fn())
const refresh = vi.hoisted(() => vi.fn())
const serverFunction = vi.hoisted(() => vi.fn())
const modalState = vi.hoisted(() => ({ isOpen: true }))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}))

vi.mock('payload/shared', () => ({
  branchesCollectionSlug: 'payload-branches',
  formatAdminURL: ({ path }: { path: string }) => path,
  MAIN_BRANCH: 'main',
}))

vi.mock('../../fields/Checkbox/Input.js', () => ({ CheckboxInput: () => null }))
vi.mock('../../fields/FieldLabel/index.js', () => ({ FieldLabel: () => null }))
vi.mock('../../fields/RadioGroup/Radio/index.js', () => ({ Radio: () => null }))
vi.mock('../../providers/Config/index.js', () => ({
  useConfig: () => ({ config: { routes: { api: '/api' }, serverURL: 'http://localhost:3000' } }),
}))
vi.mock('../../providers/RouterAdapter/index.js', () => ({
  useRouter: () => ({ refresh }),
}))
vi.mock('../../providers/RouteTransition/index.js', () => ({
  useRouteTransition: () => ({
    startRouteTransition: (callback: () => void) => callback(),
  }),
}))
vi.mock('../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction }),
}))
vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, number | string>) => {
      if (key === 'branching:mergingProgress') {
        return `Merging ${values?.current} of ${values?.total}`
      }
      if (key === 'branching:mergedOfTotal') {
        return `Merged ${values?.current} of ${values?.total}`
      }

      return (
        {
          'branching:merge': 'Merge',
          'branching:mergeAllCount': 'Merge all changes',
          'branching:mergeBranchInto': 'Merge branch',
          'branching:mergeBlocked': 'Merge blocked',
          'branching:mergeComplete': 'Merge complete',
          'branching:mergePartial': 'Merge partially complete',
          'branching:mergeNow': 'Merge now',
          'branching:mergeStarting': 'Starting merge',
          'branching:mergedCount': `${values?.count} change(s) merged.`,
          'branching:scheduleMerge': 'Schedule merge',
          'general:cancel': 'Cancel',
          'general:close': 'Close',
        }[key] ?? key
      )
    },
  }),
}))
vi.mock('../../utilities/api.js', () => ({ requests: { get: vi.fn() } }))
vi.mock('../Button/index.js', () => ({
  Button: ({
    children,
    disabled,
    onClick,
  }: {
    children: ReactNode
  } & ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button disabled={disabled} onClick={onClick} type="button">
      {children}
    </button>
  ),
}))
vi.mock('../ChangeSummary/index.js', () => ({ ChangeSummary: () => null }))
vi.mock('../DatePicker/index.js', () => ({ DatePickerField: () => null }))
vi.mock('../Dialog/index.js', () => ({
  DialogBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({
    title,
    onClose,
    showClose,
  }: {
    title: ReactNode
    onClose?: () => void
    showClose?: boolean
  }) => (
    <>
      <h2>{title}</h2>
      {showClose && (
        <button onClick={onClose} type="button">
          Header close
        </button>
      )}
    </>
  ),
  DialogModal: ({ children, closeOnEsc }: { children: ReactNode; closeOnEsc?: boolean }) => (
    <div data-testid="dialog" data-close-on-esc={String(closeOnEsc)}>
      {children}
    </div>
  ),
}))
vi.mock('../Link/index.js', () => ({ Link: ({ children }: { children: ReactNode }) => children }))
vi.mock('../Modal/index.js', () => ({
  useModal: () => ({ isModalOpen: () => modalState.isOpen }),
}))
const mergeTarget = vi.hoisted(() => ({
  branchID: 'campaign-id',
  branchName: 'Campaign',
  branchSlug: 'campaign',
  changes: [],
  totalChanges: 2,
}))

vi.mock('./context.js', () => ({
  useMergeBranch: () => ({ closeMerge, target: mergeTarget }),
}))

let mergeStreamController: ReadableStreamDefaultController<Uint8Array>

beforeEach(() => {
  modalState.isOpen = true
  closeMerge.mockClear()
  vi.stubGlobal('process', { env: {} })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          mergeStreamController = controller
          controller.enqueue(
            new TextEncoder().encode(
              `${JSON.stringify({ current: 1, total: 2, type: 'progress' })}\n`,
            ),
          )
        },
      }),
      ok: true,
    })),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('should expose merge progress and completion to assistive technology', async () => {
  const screen = await render(<MergeBranchModal />)

  await screen.getByRole('button', { name: 'Merge' }).click()

  const progressbar = screen.getByRole('progressbar')
  await expect.element(progressbar).toHaveAttribute('aria-valuemin', '0')
  await expect.element(progressbar).toHaveAttribute('aria-valuemax', '2')
  await expect.element(progressbar).toHaveAttribute('aria-valuenow', '1')
  await expect.element(progressbar).toHaveAttribute('aria-valuetext', 'Merging 1 of 2')
  await expect.element(screen.getByRole('status')).toHaveTextContent('Merging 1 of 2')

  mergeStreamController.enqueue(
    new TextEncoder().encode(
      `${JSON.stringify({
        result: {
          blocked: [],
          canMerge: false,
          mergeable: [],
          merged: [{ changeID: 'change-id' }],
          validationErrors: [],
          warnings: [],
        },
        type: 'complete',
      })}\n`,
    ),
  )
  mergeStreamController.close()

  await expect.element(screen.getByRole('status')).toHaveTextContent('Merged 1 of 1')
})

test('should report a blocked merge without a completed progress bar', async () => {
  const screen = await render(<MergeBranchModal />)

  await screen.getByRole('button', { name: 'Merge' }).click()

  mergeStreamController.enqueue(
    new TextEncoder().encode(
      `${JSON.stringify({
        result: {
          blocked: [
            {
              changeID: 'blocked-change',
              message: 'A dependency is unavailable',
              operation: 'update',
              reason: 'dependency',
            },
          ],
          canMerge: false,
          mergeable: [],
          merged: [],
          validationErrors: [
            {
              changeID: 'invalid-change',
              message: 'A required field is missing',
            },
          ],
          warnings: [],
        },
        type: 'complete',
      })}\n`,
    ),
  )
  mergeStreamController.close()

  await expect.element(screen.getByRole('heading', { name: 'Merge blocked' })).toBeVisible()
  await expect.element(screen.getByRole('status')).toHaveTextContent('Merge blocked')
  await expect.element(screen.getByRole('progressbar')).not.toBeInTheDocument()
  await expect.element(screen.getByRole('alert')).toBeVisible()
  await expect.element(screen.getByText('A dependency is unavailable')).toBeVisible()
  await expect.element(screen.getByText('A required field is missing')).toBeVisible()
})

test('should report a partial merge with the actual merged count and problems', async () => {
  const screen = await render(<MergeBranchModal />)

  await screen.getByRole('button', { name: 'Merge' }).click()

  mergeStreamController.enqueue(
    new TextEncoder().encode(
      `${JSON.stringify({
        result: {
          blocked: [
            {
              changeID: 'blocked-change',
              message: 'One change could not be applied',
              operation: 'update',
              reason: 'access',
            },
          ],
          canMerge: true,
          mergeable: [],
          merged: [{ changeID: 'merged-change' }],
          validationErrors: [],
          warnings: [],
        },
        type: 'complete',
      })}\n`,
    ),
  )
  mergeStreamController.close()

  await expect
    .element(screen.getByRole('heading', { name: 'Merge partially complete' }))
    .toBeVisible()
  await expect.element(screen.getByRole('status')).toHaveTextContent('1 change(s) merged.')
  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('One change could not be applied')
})

test('should prevent Escape dismissal while a merge is running', async () => {
  const screen = await render(<MergeBranchModal />)

  await screen.getByRole('button', { name: 'Merge', exact: true }).click()

  await expect.element(screen.getByTestId('dialog')).toHaveAttribute('data-close-on-esc', 'false')
  await expect.element(screen.getByRole('button', { name: 'Header close' })).not.toBeInTheDocument()
})

test('should route header dismissal through closeMerge', async () => {
  const screen = await render(<MergeBranchModal />)

  await screen.getByRole('button', { name: 'Header close' }).click()

  expect(closeMerge).toHaveBeenCalledOnce()
})

test('should clear the target after an external dismissal', async () => {
  const screen = await render(<MergeBranchModal />)

  modalState.isOpen = false
  await screen.rerender(<MergeBranchModal />)

  await expect.poll(() => closeMerge.mock.calls.length).toBeGreaterThan(0)
})
