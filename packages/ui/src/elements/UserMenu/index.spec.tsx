import type { LinkAdapterProps, RouterAdapterRouter } from 'payload'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { RouterAdapterContext } from '../../providers/RouterAdapter/index.js'
import { UserMenu } from './index.js'

vi.mock('@faceless-ui/window-info', () => ({
  useWindowInfo: () => ({ breakpoints: { s: false } }),
}))

vi.mock('../../providers/Auth/index.js', () => ({
  useAuth: () => ({ user: { id: '1', email: 'dev@payloadcms.com' } }),
}))

vi.mock('../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: {
      admin: {
        routes: { account: '/account', logout: '/logout' },
        theme: 'light',
        user: 'users',
      },
      routes: { admin: '/admin' },
    },
    getEntityConfig: () => undefined,
  }),
}))

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ languageOptions: [], t: (key: string) => key }),
}))

const router: RouterAdapterRouter = {
  back: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
}

const TestLink = ({ href, ...props }: LinkAdapterProps) => <a href={href} {...props} />

beforeEach(() => {
  // `formatAdminURL` reads the Next.js base path from `process.env.NEXT_BASE_PATH`
  vi.stubGlobal('process', { env: { NEXT_BASE_PATH: '/cms' } })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('should include the base path in the account link', async () => {
  const screen = await render(
    <RouterAdapterContext
      value={{
        Link: TestLink,
        params: {},
        pathname: '/',
        router,
        searchParams: new URLSearchParams(),
      }}
    >
      <UserMenu />
    </RouterAdapterContext>,
  )

  await screen.getByRole('button', { name: 'authentication:account' }).click()

  await expect
    .element(screen.getByRole('menuitem', { name: 'authentication:account: dev@payloadcms.com' }))
    .toHaveAttribute('href', '/cms/admin/account')
})
