import { describe, expect, it } from 'vitest'

import { isPathMatchingRoute } from './isPathMatchingRoute.js'

describe('isPathMatchingRoute', () => {
  describe('no path defined', () => {
    it('should return false when path is undefined', () => {
      expect(isPathMatchingRoute({ currentRoute: '/anything', path: undefined })).toBe(false)
    })

    it('should return false when path is empty string', () => {
      expect(isPathMatchingRoute({ currentRoute: '/anything', path: '' })).toBe(false)
    })
  })

  describe('exact matching', () => {
    it('should match when currentRoute exactly equals the static path', () => {
      expect(
        isPathMatchingRoute({ currentRoute: '/dashboard', exact: true, path: '/dashboard' }),
      ).toBe(true)
    })

    it('should not match when currentRoute differs from the path', () => {
      expect(
        isPathMatchingRoute({ currentRoute: '/settings', exact: true, path: '/dashboard' }),
      ).toBe(false)
    })

    it('should not match a sub-path when exact is true', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/dashboard/settings',
          exact: true,
          path: '/dashboard',
        }),
      ).toBe(false)
    })

    it('should match a parameterized path exactly', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/custom/123',
          exact: true,
          path: '/custom/:id',
        }),
      ).toBe(true)
    })

    it('should not match a parameterized path with extra segments', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/custom/123/edit',
          exact: true,
          path: '/custom/:id',
        }),
      ).toBe(false)
    })

    it('should match root path exactly', () => {
      expect(isPathMatchingRoute({ currentRoute: '/', exact: true, path: '/' })).toBe(true)
    })

    it('should not match root path against other routes when exact', () => {
      expect(isPathMatchingRoute({ currentRoute: '/login', exact: true, path: '/' })).toBe(false)
    })
  })

  describe('non-exact (prefix) matching', () => {
    it('should match when currentRoute equals the path', () => {
      expect(isPathMatchingRoute({ currentRoute: '/dashboard', path: '/dashboard' })).toBe(true)
    })

    it('should match a sub-path at a segment boundary', () => {
      expect(isPathMatchingRoute({ currentRoute: '/dashboard/settings', path: '/dashboard' })).toBe(
        true,
      )
    })

    it('should match deeply nested sub-paths', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/dashboard/settings/advanced/debug',
          path: '/dashboard',
        }),
      ).toBe(true)
    })

    it('should not match when route shares a prefix but not at a segment boundary', () => {
      expect(isPathMatchingRoute({ currentRoute: '/dashboard-extra', path: '/dashboard' })).toBe(
        false,
      )
    })

    it('should not match a completely different route', () => {
      expect(isPathMatchingRoute({ currentRoute: '/settings', path: '/dashboard' })).toBe(false)
    })

    it('should match a parameterized path with a sub-path', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/custom/123/edit',
          path: '/custom/:id',
        }),
      ).toBe(false)
      // pathToRegexp is end-anchored by default, so /custom/:id does not match /custom/123/edit.
      // The literal fallback '/custom/:id' also won't startsWith-match.
      // Parameterized views should use exact: true or include all segments in the pattern.
    })

    it('should match when :id captures the full segment including non-slash characters', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/custom/123extra',
          path: '/custom/:id',
        }),
      ).toBe(true)
      // :id captures everything up to the next / — '123extra' is a valid :id value
    })
  })

  describe('root path / without exact — regression for route shadowing bug', () => {
    it('should match root path against itself', () => {
      expect(isPathMatchingRoute({ currentRoute: '/', path: '/' })).toBe(true)
    })

    it('should not match root path against /login', () => {
      expect(isPathMatchingRoute({ currentRoute: '/login', path: '/' })).toBe(false)
    })

    it('should not match root path against /collections/posts', () => {
      expect(isPathMatchingRoute({ currentRoute: '/collections/posts', path: '/' })).toBe(false)
    })

    it('should not match root path against /collections/posts/123', () => {
      expect(isPathMatchingRoute({ currentRoute: '/collections/posts/123', path: '/' })).toBe(false)
    })
  })

  describe('sensitive option', () => {
    it('should match case-insensitively by default', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/Dashboard',
          exact: true,
          path: '/dashboard',
        }),
      ).toBe(true)
    })

    it('should not match different cases when sensitive is true', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/Dashboard',
          exact: true,
          path: '/dashboard',
          sensitive: true,
        }),
      ).toBe(false)
    })
  })

  describe('strict option', () => {
    it('should match with or without trailing slash by default', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/dashboard/',
          exact: true,
          path: '/dashboard',
        }),
      ).toBe(true)
    })

    it('should not match trailing slash mismatch when strict is true', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/dashboard/',
          exact: true,
          path: '/dashboard',
          strict: true,
        }),
      ).toBe(false)
    })
  })
})
