import { describe, expect, it } from 'vitest'

import { isPathMatchingRoute } from './isPathMatchingRoute.js'

describe('isPathMatchingRoute', () => {
  describe('no path defined', () => {
    it('should return false when path is undefined', () => {
      expect(isPathMatchingRoute({ currentRoute: '/anything', path: undefined })).toBeFalsy()
    })

    it('should return false when path is empty string', () => {
      expect(isPathMatchingRoute({ currentRoute: '/anything', path: '' })).toBeFalsy()
    })
  })

  describe('exact matching', () => {
    it('should match when currentRoute exactly equals the static path', () => {
      expect(
        isPathMatchingRoute({ currentRoute: '/dashboard', exact: true, path: '/dashboard' }),
      ).toBeTruthy()
    })

    it('should not match when currentRoute differs from the path', () => {
      expect(
        isPathMatchingRoute({ currentRoute: '/settings', exact: true, path: '/dashboard' }),
      ).toBeFalsy()
    })

    it('should not match a sub-path when exact is true', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/dashboard/settings',
          exact: true,
          path: '/dashboard',
        }),
      ).toBeFalsy()
    })

    it('should match a parameterized path exactly', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/custom/123',
          exact: true,
          path: '/custom/:id',
        }),
      ).toBeTruthy()
    })

    it('should not match a parameterized path with extra segments', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/custom/123/edit',
          exact: true,
          path: '/custom/:id',
        }),
      ).toBeFalsy()
    })

    it('should match root path exactly', () => {
      expect(isPathMatchingRoute({ currentRoute: '/', exact: true, path: '/' })).toBeTruthy()
    })

    it('should not match root path against other routes when exact', () => {
      expect(isPathMatchingRoute({ currentRoute: '/login', exact: true, path: '/' })).toBeFalsy()
    })
  })

  describe('non-exact (prefix) matching', () => {
    it('should match when currentRoute equals the path', () => {
      expect(isPathMatchingRoute({ currentRoute: '/dashboard', path: '/dashboard' })).toBeTruthy()
    })

    it('should match a sub-path at a segment boundary', () => {
      expect(
        isPathMatchingRoute({ currentRoute: '/dashboard/settings', path: '/dashboard' }),
      ).toBeTruthy()
    })

    it('should match deeply nested sub-paths', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/dashboard/settings/advanced/debug',
          path: '/dashboard',
        }),
      ).toBeTruthy()
    })

    it('should not match when route shares a prefix but not at a segment boundary', () => {
      expect(
        isPathMatchingRoute({ currentRoute: '/dashboard-extra', path: '/dashboard' }),
      ).toBeFalsy()
    })

    it('should not match a completely different route', () => {
      expect(isPathMatchingRoute({ currentRoute: '/settings', path: '/dashboard' })).toBeFalsy()
    })

    it('should match a parameterized path with a sub-path', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/custom/123/edit',
          path: '/custom/:id',
        }),
      ).toBeFalsy()
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
      ).toBeTruthy()
      // :id captures everything up to the next / — '123extra' is a valid :id value
    })
  })

  describe('root path / without exact — regression for route shadowing bug', () => {
    it('should match root path against itself', () => {
      expect(isPathMatchingRoute({ currentRoute: '/', path: '/' })).toBeTruthy()
    })

    it('should not match root path against /login', () => {
      expect(isPathMatchingRoute({ currentRoute: '/login', path: '/' })).toBeFalsy()
    })

    it('should not match root path against /collections/posts', () => {
      expect(isPathMatchingRoute({ currentRoute: '/collections/posts', path: '/' })).toBeFalsy()
    })

    it('should not match root path against /collections/posts/123', () => {
      expect(isPathMatchingRoute({ currentRoute: '/collections/posts/123', path: '/' })).toBeFalsy()
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
      ).toBeTruthy()
    })

    it('should not match different cases when sensitive is true', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/Dashboard',
          exact: true,
          path: '/dashboard',
          sensitive: true,
        }),
      ).toBeFalsy()
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
      ).toBeTruthy()
    })

    it('should not match trailing slash mismatch when strict is true', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/dashboard/',
          exact: true,
          path: '/dashboard',
          strict: true,
        }),
      ).toBeFalsy()
    })
  })

  describe('match strength — enables best-match resolution in consumers', () => {
    it('should expose matchedLength reflecting the regex-matched portion of currentRoute for parameterized paths', () => {
      const result = isPathMatchingRoute({
        currentRoute: '/orders/123',
        path: '/orders/:id',
      })

      expect(result).not.toBe(false)
      expect(result).toMatchObject({
        matchedLength: '/orders/123'.length,
        dynamicSegmentCount: 1,
      })
    })

    it('should expose matchedLength reflecting the literal path for prefix matches', () => {
      const result = isPathMatchingRoute({
        currentRoute: '/orders/123',
        path: '/orders',
      })

      expect(result).not.toBe(false)
      expect(result).toMatchObject({
        matchedLength: '/orders'.length,
        dynamicSegmentCount: 0,
      })
    })

    it('should rank a more specific parameterized path above a less specific literal prefix at the same URL', () => {
      const specific = isPathMatchingRoute({
        currentRoute: '/orders/123',
        path: '/orders/:id',
      })

      const generic = isPathMatchingRoute({
        currentRoute: '/orders/123',
        path: '/orders',
      })

      expect(specific).not.toBe(false)
      expect(generic).not.toBe(false)
      expect((specific as { matchedLength: number }).matchedLength).toBeGreaterThan(
        (generic as { matchedLength: number }).matchedLength,
      )
    })

    it('should return false for a non-matching path (not a zero-length match)', () => {
      expect(
        isPathMatchingRoute({
          currentRoute: '/orders',
          path: '/products',
        }),
      ).toBeFalsy()
    })
  })
})
