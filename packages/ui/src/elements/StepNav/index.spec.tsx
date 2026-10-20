import type { LinkAdapterProps } from 'payload'

import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import '../../css/spacing.css'

import { RouterAdapterContext } from '../../providers/RouterAdapter/index.js'
import { SetStepNav, StepNav, StepNavProvider } from './index.js'

vi.mock('../../providers/Config/index.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../providers/Config/index.js')>()),
  useConfig: () => ({ config: { routes: { admin: '/admin' } } }),
}))

const TestLink = ({ href, prefetch: _prefetch, ...props }: LinkAdapterProps) => (
  <a href={href} {...props} />
)

const nav = [
  { label: 'A collection with a very long plural label', url: '/admin/collections/long' },
  { label: 'Current document' },
]

test('should expose the full label of a truncated breadcrumb on hover', async () => {
  const screen = await render(
    <RouterAdapterContext
      value={{
        Link: TestLink,
        params: {},
        pathname: '/',
        router: { back: vi.fn(), push: vi.fn(), refresh: vi.fn(), replace: vi.fn() },
        searchParams: new URLSearchParams(),
      }}
    >
      <StepNavProvider>
        <SetStepNav nav={nav} />
        <StepNav />
      </StepNavProvider>
    </RouterAdapterContext>,
  )

  const link = screen.getByRole('link', { name: 'A collection with a very long plural label' })
  const label = link.element().querySelector('.btn__label')

  expect(label.scrollWidth).toBeGreaterThan(label.clientWidth)
  await expect.element(link).toHaveAttribute('title', 'A collection with a very long plural label')
})
