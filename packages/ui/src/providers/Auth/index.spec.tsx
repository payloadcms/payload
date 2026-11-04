import type { AuthenticatedUser } from 'payload'

import React from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { AuthProvider, useAuth } from './index.js'

vi.stubGlobal('process', { env: {} })

const mocks = vi.hoisted(() => ({
  closeAllModals: vi.fn(),
  get: vi.fn(),
  openModal: vi.fn(),
  post: vi.fn(),
  router: { replace: vi.fn() },
  searchParams: new URLSearchParams(),
  startRouteTransition: vi.fn(),
  i18n: { language: 'en' },
  config: {
    admin: {
      autoLogin: false,
      autoRefresh: false,
      routes: { inactivity: '/logout-inactivity', login: '/login' },
      user: 'users',
    },
    routes: { admin: '/admin', api: '/api' },
  },
}))

vi.mock('@faceless-ui/modal', () => ({ useModal: () => mocks }))
vi.mock('../../elements/StayLoggedIn/index.js', () => ({ stayLoggedInModalSlug: 'stay-logged-in' }))
vi.mock('../../utilities/api.js', () => ({ requests: { get: mocks.get, post: mocks.post } }))
vi.mock('../Config/index.js', () => ({ useConfig: () => ({ config: mocks.config }) }))
vi.mock('../Translation/index.js', () => ({ useTranslation: () => ({ i18n: mocks.i18n }) }))
vi.mock('../RouterAdapter/index.js', () => ({
  usePathname: () => '/admin/logout',
  useRouter: () => mocks.router,
  useSearchParams: () => mocks.searchParams,
}))
vi.mock('../RouteTransition/index.js', () => ({ useRouteTransition: () => mocks }))

const publicUser = { id: 'public-user', collection: 'public-users' } as AuthenticatedUser

test('should log out the requested collection after the admin me request clears a public user', async () => {
  let auth: ReturnType<typeof useAuth>

  mocks.get.mockResolvedValue(new Response(JSON.stringify({ user: null }), { status: 200 }))
  mocks.post.mockReset().mockResolvedValue(new Response(null, { status: 200 }))

  function Consumer() {
    auth = useAuth()
    return null
  }

  await render(
    <AuthProvider user={publicUser}>
      <Consumer />
    </AuthProvider>,
  )

  await vi.waitFor(() => expect(auth!.user).toBeNull())
  expect(mocks.get).toHaveBeenCalledWith('/api/users/me', expect.anything())

  await auth!.logOut({ collection: publicUser.collection })

  expect(mocks.post).toHaveBeenCalledExactlyOnceWith('/api/public-users/logout')
  expect(auth!.user).toBeNull()
})

test('should use the current user collection when logging out without arguments', async () => {
  let auth: ReturnType<typeof useAuth>

  mocks.get.mockResolvedValue(new Response(JSON.stringify({ user: publicUser }), { status: 200 }))
  mocks.post.mockReset().mockResolvedValue(new Response(null, { status: 200 }))

  function Consumer() {
    auth = useAuth()
    return null
  }

  await render(
    <AuthProvider user={publicUser}>
      <Consumer />
    </AuthProvider>,
  )

  await auth!.fetchFullUser()
  await auth!.logOut()

  expect(mocks.post).toHaveBeenCalledExactlyOnceWith('/api/public-users/logout')
  await vi.waitFor(() => expect(auth!.user).toBeNull())
})
