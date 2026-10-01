import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { MergeBranchModal } from './index.js'

const closeMerge = vi.hoisted(() => vi.fn())
const refresh = vi.hoisted(() => vi.fn())

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}))

vi.mock('payload/shared', () => ({
  branchChangesCollectionSlug: 'payload-branch-changes',
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
  useServerFunctions: () => ({ serverFunction: vi.fn() }),
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
          'branching:mergeComplete': 'Merge complete',
          'branching:mergeNow': 'Merge now',
          'branching:mergeStarting': 'Starting merge',
          'branching:scheduleMerge': 'Schedule merge',
          'general:cancel': 'Cancel',
          'general:close': 'Close',
        }[key] ?? key
      )
    },
  }),
}))
vi.mock('../../utilities/api.js', () => ({ requests: { get: vi.fn() } }))
vi.mock('../../utilities/buildUpcomingMergeWhere.js', () => ({
  buildUpcomingMergeWhere: () => ({}),
}))
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
  DialogHeader: ({ title }: { title: ReactNode }) => <h2>{title}</h2>,
  DialogModal: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../Link/index.js', () => ({ Link: ({ children }: { children: ReactNode }) => children }))
vi.mock('../Modal/index.js', () => ({
  useModal: () => ({ isModalOpen: () => true }),
}))
vi.mock('./context.js', () => ({
  useMergeBranch: () => ({
    closeMerge,
    target: {
      branchID: 'campaign-id',
      branchName: 'Campaign',
      branchSlug: 'campaign',
      changes: [],
      totalChanges: 2,
    },
  }),
}))

let mergeStreamController: ReadableStreamDefaultController<Uint8Array>

beforeEach(() => {
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
          warnings: [],
        },
        type: 'complete',
      })}\n`,
    ),
  )
  mergeStreamController.close()

  await expect.element(screen.getByRole('status')).toHaveTextContent('Merged 1 of 1')
})

test('should expose a valid completed range when no changes were merged', async () => {
  const screen = await render(<MergeBranchModal />)

  await screen.getByRole('button', { name: 'Merge' }).click()

  mergeStreamController.enqueue(
    new TextEncoder().encode(
      `${JSON.stringify({
        result: {
          blocked: [],
          canMerge: false,
          mergeable: [],
          merged: [],
          warnings: [],
        },
        type: 'complete',
      })}\n`,
    ),
  )
  mergeStreamController.close()

  const progressbar = screen.getByRole('progressbar')

  await expect.element(progressbar).toHaveAttribute('aria-valuemax', '1')
  await expect.element(progressbar).toHaveAttribute('aria-valuenow', '1')
  await expect.element(progressbar).toHaveAttribute('aria-valuetext', 'Merged 0 of 0')
  await expect.element(screen.getByRole('status')).toHaveTextContent('Merged 0 of 0')
})
