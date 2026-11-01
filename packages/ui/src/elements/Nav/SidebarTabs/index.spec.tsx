import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { RenderTabServerFnReturnType } from './renderTabServerFn.js'

import { SidebarTabsClient } from './index.client.js'

const { serverFunction, setPreference } = vi.hoisted(() => ({
  serverFunction: vi.fn(),
  setPreference: vi.fn(),
}))

vi.mock('../../../providers/Preferences/index.js', () => ({
  usePreferences: () => ({ setPreference }),
}))

vi.mock('../../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction }),
}))

vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: () => 'Loading' }),
}))

test('should keep the active tab loading when an earlier tab request completes', async () => {
  const first = Promise.withResolvers<RenderTabServerFnReturnType>()
  const second = Promise.withResolvers<RenderTabServerFnReturnType>()

  serverFunction.mockImplementation(({ args: { tabSlug } }) =>
    tabSlug === 'first' ? first.promise : second.promise,
  )

  const screen = await render(
    <SidebarTabsClient
      baseClass="sidebar-tabs"
      initialActiveTabID="initial"
      initialTabContents={{ initial: <div>Initial content</div> }}
      loadingDelay={0}
      tabs={[
        { icon: null, label: 'Initial', slug: 'initial' },
        { icon: null, label: 'First', slug: 'first' },
        { icon: null, label: 'Second', slug: 'second' },
      ]}
    />,
  )
  const panel = screen.getByRole('tabpanel', { name: 'Second' })

  try {
    await screen.getByRole('tab', { name: 'First', exact: true }).click()
    await screen.getByRole('tab', { name: 'Second', exact: true }).click()
    await expect.element(panel.getByText('Loading...')).toBeVisible()

    first.resolve({ component: <div>First content</div> })
    await expect.element(screen.getByText('First content')).toBeInTheDocument()

    await expect.element(panel.getByText('Loading...')).toBeVisible()

    second.resolve({ component: <div>Second content</div> })

    await expect.element(panel.getByText('Second content')).toBeVisible()
    await expect.element(panel.getByText('Loading...')).not.toBeInTheDocument()
  } finally {
    first.resolve({ component: <div>First content</div> })
    second.resolve({ component: <div>Second content</div> })
  }
})
