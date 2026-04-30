import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import { formatAdminURL } from './formatAdminURL.js'

describe('formatAdminURL', () => {
  const serverURL = 'https://example.com'

  const defaultAdminRoute = '/admin'
  const rootAdminRoute = '/'

  const dummyPath = '/collections/posts'

  describe('relative URLs', () => {
    it('should ignore `serverURL` when relative=true', () => {
      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path: dummyPath,
        serverURL,
        relative: true,
      })

      expect(result).toBe(`${defaultAdminRoute}${dummyPath}`)
    })

    it('should force relative URL when `serverURL` is omitted', () => {
      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path: dummyPath,
        relative: false,
      })

      expect(result).toBe(`${defaultAdminRoute}${dummyPath}`)
    })
  })

  describe('absolute URLs', () => {
    it('should return absolute URL with serverURL', () => {
      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path: dummyPath,
        serverURL,
      })

      expect(result).toBe(
        `${serverURL}${process.env.NEXT_BASE_PATH || ''}${defaultAdminRoute}${dummyPath}`,
      )
    })

    it('should handle serverURL with trailing slash', () => {
      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path: '/collections/posts',
        serverURL: 'https://example.com/',
      })

      expect(result).toBe(
        `https://example.com${process.env.NEXT_BASE_PATH || ''}/admin/collections/posts`,
      )
    })

    it('should handle serverURL with subdirectory', () => {
      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path: '/collections/posts',
        serverURL: 'https://example.com/api/v1',
      })

      expect(result).toBe(
        `https://example.com${process.env.NEXT_BASE_PATH || ''}/admin/collections/posts`,
      )
    })
  })

  describe('admin route handling', () => {
    it('should return relative URL for adminRoute="/", no path, no `serverURL`', () => {
      const result = formatAdminURL({
        adminRoute: rootAdminRoute,
      })

      expect(result).toBe('/')
    })

    it('should handle relative URL for adminRoute="/", with path, no `serverURL`', () => {
      const result = formatAdminURL({
        adminRoute: rootAdminRoute,
        path: dummyPath,
      })

      expect(result).toBe(dummyPath)
    })

    it('should return absolute URL for adminRoute="/", no path, with `serverURL`', () => {
      const result = formatAdminURL({
        adminRoute: rootAdminRoute,
        serverURL,
      })

      expect(result).toBe('https://example.com/')
    })

    it('should handle absolute URL for adminRoute="/", with path and `serverURL`', () => {
      const result = formatAdminURL({
        adminRoute: rootAdminRoute,
        serverURL,
        path: dummyPath,
      })

      expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}${dummyPath}`)
    })
  })

  describe('base path handling', () => {
    it('should include basePath in URL', () => {
      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        basePath: '/v1',
        path: dummyPath,
        serverURL,
      })

      expect(result).toBe(
        `${serverURL}${process.env.NEXT_BASE_PATH || ''}/v1${defaultAdminRoute}${dummyPath}`,
      )
    })

    it('should handle basePath with adminRoute="/"', () => {
      const result = formatAdminURL({
        adminRoute: rootAdminRoute,
        basePath: '/v1',
        serverURL,
      })

      expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}/v1`)
    })

    it('should handle basePath with no adminRoute', () => {
      const result = formatAdminURL({
        adminRoute: undefined,
        basePath: '/v1',
        path: dummyPath,
        serverURL,
      })

      expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}/v1${dummyPath}`)
    })

    it('should handle empty basePath', () => {
      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        basePath: '',
        path: dummyPath,
        serverURL,
      })

      expect(result).toBe(
        `${serverURL}${process.env.NEXT_BASE_PATH || ''}${defaultAdminRoute}${dummyPath}`,
      )
    })
  })

  describe('path handling', () => {
    it('should handle empty string path', () => {
      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path: '',
        serverURL,
      })

      expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}${defaultAdminRoute}`)
    })

    it('should handle null path', () => {
      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path: null,
        serverURL,
      })
      expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}${defaultAdminRoute}`)
    })

    it('should handle undefined path', () => {
      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path: undefined,
        serverURL,
      })

      expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}${defaultAdminRoute}`)
    })

    it('should handle path with query parameters', () => {
      const path = `${dummyPath}?page=2`

      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path,
        serverURL,
      })

      expect(result).toBe(
        `${serverURL}${process.env.NEXT_BASE_PATH || ''}${defaultAdminRoute}${path}`,
      )
    })
  })

  describe('edge cases', () => {
    it('should return "/" when given minimal args', () => {
      const result = formatAdminURL({
        adminRoute: undefined,
        basePath: '',
        path: '',
        relative: true,
      })

      expect(result).toBe('/')
    })
  })

  describe('trailing slash handling', () => {
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

    it('should append trailing slash to relative admin URL', () => {
      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path: dummyPath,
        relative: true,
      })

      expect(result).toBe(`${defaultAdminRoute}${dummyPath}/`)
    })

    it('should append trailing slash to relative api URL', () => {
      const result = formatAdminURL({
        apiRoute: '/api',
        path: '/users',
        relative: true,
      })

      expect(result).toBe(`${process.env.NEXT_BASE_PATH || ''}/api/users/`)
    })

    it('should append trailing slash to absolute URL', () => {
      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path: dummyPath,
        serverURL,
      })

      expect(result).toBe(
        `${serverURL}${process.env.NEXT_BASE_PATH || ''}${defaultAdminRoute}${dummyPath}/`,
      )
    })

    it('should append trailing slash when basePath is set', () => {
      const result = formatAdminURL({
        apiRoute: '/api',
        basePath: '/v1',
        path: '/users',
        serverURL,
      })

      expect(result).toBe(`${serverURL}${process.env.NEXT_BASE_PATH || ''}/v1/api/users/`)
    })

    it('should not append trailing slash to root "/"', () => {
      const result = formatAdminURL({
        adminRoute: rootAdminRoute,
        relative: true,
      })

      expect(result).toBe('/')
    })

    it('should not double-slash when path already ends with /', () => {
      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path: '/collections/posts',
        relative: true,
      })

      expect(result.endsWith('//')).toBe(false)
      expect(result).toBe(`${defaultAdminRoute}/collections/posts/`)
    })

    it('should place trailing slash before query string', () => {
      const path = `${dummyPath}?page=2`

      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path,
        relative: true,
      })

      expect(result).toBe(`${defaultAdminRoute}${dummyPath}/?page=2`)
    })

    it('should leave URLs unchanged when env var is not set', () => {
      delete process.env.NEXT_TRAILING_SLASH

      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path: dummyPath,
        relative: true,
      })

      expect(result).toBe(`${defaultAdminRoute}${dummyPath}`)
    })

    it('should leave URLs unchanged when env var is "false"', () => {
      process.env.NEXT_TRAILING_SLASH = 'false'

      const result = formatAdminURL({
        adminRoute: defaultAdminRoute,
        path: dummyPath,
        relative: true,
      })

      expect(result).toBe(`${defaultAdminRoute}${dummyPath}`)
    })
  })
})
