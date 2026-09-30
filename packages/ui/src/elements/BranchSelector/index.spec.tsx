import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { BranchSelector } from './index.js'

vi.mock('../../icons/Branch/index.js', () => ({ BranchIcon: () => null }))
vi.mock('../../icons/Chevron/index.js', () => ({ ChevronIcon: () => null }))
vi.mock('../../icons/NewTab/index.js', () => ({ NewTabIcon: () => null }))
vi.mock('../../icons/Plus/index.js', () => ({ PlusIcon: () => null }))

vi.mock('../../providers/Branch/index.js', () => ({
  useBranch: () => ({
    activeBranch: 'campaign',
    branches: [{ id: 'campaign-id', name: 'Campaign', slug: 'campaign' }],
    setBranch: vi.fn(),
  }),
  useShowBranchSelector: () => true,
}))

vi.mock('../../providers/Config/index.js', () => ({
  useConfig: () => ({ config: { routes: { admin: '/admin' } } }),
}))

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'branching:branches': 'Branches',
        'branching:selectBranch': 'Select branch',
      })[key] ?? key,
  }),
}))

vi.mock('../Button/index.js', () => ({
  Button: ({
    'aria-label': ariaLabel,
    children,
    className,
    extraButtonProps,
    onClick,
  }: {
    children: ReactNode
    extraButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>
  } & ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
      {...extraButtonProps}
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  ),
}))

vi.mock('../Combobox/index.js', () => ({
  Combobox: ({
    renderButton,
  }: {
    renderButton: (args: {
      active: boolean
      onClick: () => void
      onKeyDown: () => void
    }) => ReactNode
  }) => renderButton({ active: false, onClick: vi.fn(), onKeyDown: vi.fn() }),
}))

vi.mock('../Link/index.js', () => ({ Link: ({ children }: { children: ReactNode }) => children }))
vi.mock('../MergeBranch/context.js', () => ({ useMergeBranch: () => ({ openMerge: vi.fn() }) }))
vi.mock('../Modal/index.js', () => ({ useModal: () => ({ openModal: vi.fn() }) }))
vi.mock('./NewBranchModal/index.js', () => ({
  NewBranchModal: () => null,
  newBranchModalSlug: 'new-branch',
}))

beforeEach(() => {
  vi.stubGlobal('process', { env: {} })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('should include the visible active branch in the trigger accessible name', async () => {
  const screen = await render(<BranchSelector />)

  await expect.element(screen.getByRole('button', { name: /Campaign/ })).toBeInTheDocument()
})
