import type { SanitizedConfig } from 'payload'

import { describe, expect, it } from 'vitest'

import { isCustomAdminView } from './isCustomAdminView.js'

describe('isCustomAdminView', () => {
  const adminRoute = '/admin'

  const configWithCustomDashboard = {
    admin: {
      components: {
        views: {
          dashboard: {
            path: '/',
          },
        },
      },
    },
  } as unknown as SanitizedConfig

  it('should not bypass admin access for the root admin route even with a custom dashboard view', () => {
    // The root path '/' maps to the dashboard — it is not a public custom view.
    // canAccessAdmin must still be enforced for the admin root.
    const result = isCustomAdminView({
      adminRoute,
      config: configWithCustomDashboard,
      route: '/admin',
    })

    expect(result).toBe(false)
  })

  it('should not match collection routes as custom dashboard views when dashboard path is "/"', () => {
    const result = isCustomAdminView({
      adminRoute,
      config: configWithCustomDashboard,
      route: '/admin/collections/tickets',
    })

    expect(result).toBe(false)
  })

  it('should not match document routes as custom dashboard views when dashboard path is "/"', () => {
    const result = isCustomAdminView({
      adminRoute,
      config: configWithCustomDashboard,
      route: '/admin/collections/tickets/123',
    })

    expect(result).toBe(false)
  })

  it('should return false when no custom views are configured', () => {
    const config = {} as SanitizedConfig

    const result = isCustomAdminView({
      adminRoute,
      config,
      route: '/admin/collections/tickets',
    })

    expect(result).toBe(false)
  })

  it('should return true for a custom view with a non-root path', () => {
    const config = {
      admin: {
        components: {
          views: {
            myCustomView: {
              path: '/my-custom-view',
            },
          },
        },
      },
    } as unknown as SanitizedConfig

    const result = isCustomAdminView({
      adminRoute,
      config,
      route: '/admin/my-custom-view',
    })

    expect(result).toBe(true)
  })

  it('should not match collection routes when a non-root custom view path is set', () => {
    const config = {
      admin: {
        components: {
          views: {
            myCustomView: {
              path: '/my-custom-view',
            },
          },
        },
      },
    } as unknown as SanitizedConfig

    const result = isCustomAdminView({
      adminRoute,
      config,
      route: '/admin/collections/tickets',
    })

    expect(result).toBe(false)
  })
})
