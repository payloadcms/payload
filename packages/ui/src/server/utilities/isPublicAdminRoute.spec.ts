import type { SanitizedConfig } from 'payload'

import { describe, expect, it } from 'vitest'

import { isPublicAdminRoute } from './isPublicAdminRoute.js'

describe('isPublicAdminRoute', () => {
  const config = {
    collections: [{ auth: true, slug: 'users' }, { slug: 'pages' }],
  } as unknown as SanitizedConfig

  it('should allow collection verification routes', () => {
    expect(
      isPublicAdminRoute({
        adminRoute: '/admin',
        config,
        route: '/admin/users/verify/token',
      }),
    ).toBe(true)
  })

  it('should not allow verification routes for collections without auth', () => {
    expect(
      isPublicAdminRoute({
        adminRoute: '/admin',
        config,
        route: '/admin/pages/verify/token',
      }),
    ).toBe(false)
  })

  it('should not allow unrelated routes containing the verification segment', () => {
    expect(
      isPublicAdminRoute({
        adminRoute: '/admin',
        config,
        route: '/admin/custom/verify/dashboard',
      }),
    ).toBe(false)
  })
})
