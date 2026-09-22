import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { handleAuthRedirect } from '../../../ui/src/utilities/handleAuthRedirect.js'

describe('handleAuthRedirect', () => {
  const config = {
    admin: {
      routes: {
        login: '/login',
        unauthorized: '/unauthorized',
      },
    },
    routes: {
      admin: '/admin',
    },
  }

  const originalTrailingSlash = process.env.NEXT_TRAILING_SLASH

  beforeEach(() => {
    process.env.NEXT_TRAILING_SLASH = 'true'
  })

  afterEach(() => {
    if (originalTrailingSlash === undefined) {
      delete process.env.NEXT_TRAILING_SLASH
    } else {
      process.env.NEXT_TRAILING_SLASH = originalTrailingSlash
    }
  })

  it('should use a canonical trailing-slash path in the redirect query', () => {
    const result = handleAuthRedirect({
      config,
      route: '/admin/collections/posts',
      searchParams: {},
    })

    expect(result).toBe('/admin/login/?redirect=%2Fadmin%2Fcollections%2Fposts%2F')
  })

  it('should not add a redirect query for the admin dashboard', () => {
    const result = handleAuthRedirect({
      config,
      route: '/admin',
      searchParams: {},
    })

    expect(result).toBe('/admin/login/')
  })

  it('should preserve non-trailing-slash URLs when trailing slashes are disabled', () => {
    process.env.NEXT_TRAILING_SLASH = 'false'

    const result = handleAuthRedirect({
      config,
      route: '/admin/collections/posts',
      searchParams: {},
    })

    expect(result).toBe('/admin/login?redirect=%2Fadmin%2Fcollections%2Fposts')
  })
})
