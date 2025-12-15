import { formatAdminURL } from './formatAdminURL.js'

describe('formatAdminURL', () => {
  const serverURL = 'https://example.com'

  describe('relative URLs', () => {
    it('should return relative path when relative=true', () => {
      const result = formatAdminURL({
        adminRoute: '/admin',
        path: '/collections/posts',
        serverURL,
        relative: true,
      })
      expect(result).toBe('/admin/collections/posts')
    })

    it('should return relative path when no serverURL provided', () => {
      const result = formatAdminURL({
        adminRoute: '/admin',
        path: '/collections/posts',
      })
      expect(result).toBe('/admin/collections/posts')
    })

    it('should return "/" when no paths provided and relative=true', () => {
      const result = formatAdminURL({
        adminRoute: null,
        relative: true,
      })
      expect(result).toBe('/')
    })
  })

  describe('absolute URLs', () => {
    it('should return absolute URL with serverURL', () => {
      const result = formatAdminURL({
        adminRoute: '/admin',
        path: '/collections/posts',
        serverURL,
      })
      expect(result).toBe('https://example.com/admin/collections/posts')
    })

    it('should handle serverURL with trailing slash', () => {
      const result = formatAdminURL({
        adminRoute: '/admin',
        path: '/collections/posts',
        serverURL: 'https://example.com/',
      })
      expect(result).toBe('https://example.com/admin/collections/posts')
    })

    it('should handle serverURL with subdirectory', () => {
      const result = formatAdminURL({
        adminRoute: '/admin',
        path: '/collections/posts',
        serverURL: 'https://example.com/api/v1',
      })
      expect(result).toBe('https://example.com/admin/collections/posts')
    })
  })

  describe('adminRoute handling', () => {
    it('should handle adminRoute="/"', () => {
      const result = formatAdminURL({
        adminRoute: '/',
        serverURL,
      })
      expect(result).toBe('https://example.com/')
    })

    it('should handle adminRoute="/" with path', () => {
      const result = formatAdminURL({
        adminRoute: '/',
        path: '/collections/posts',
        serverURL,
      })
      expect(result).toBe('https://example.com/collections/posts')
    })

    it('should handle adminRoute="/admin"', () => {
      const result = formatAdminURL({
        adminRoute: '/admin',
        serverURL,
      })
      expect(result).toBe('https://example.com/admin')
    })

    it('should handle adminRoute="/custom-admin"', () => {
      const result = formatAdminURL({
        adminRoute: '/custom-admin',
        path: '/dashboard',
        serverURL,
      })
      expect(result).toBe('https://example.com/custom-admin/dashboard')
    })

    it('should handle null adminRoute', () => {
      const result = formatAdminURL({
        adminRoute: undefined,
        path: '/collections/posts',
        serverURL,
      })
      expect(result).toBe('https://example.com/collections/posts')
    })
  })

  describe('basePath handling', () => {
    it('should include basePath in URL', () => {
      const result = formatAdminURL({
        adminRoute: '/admin',
        basePath: '/v1',
        path: '/collections/posts',
        serverURL,
      })
      expect(result).toBe('https://example.com/v1/admin/collections/posts')
    })

    it('should handle basePath with adminRoute="/"', () => {
      const result = formatAdminURL({
        adminRoute: '/',
        basePath: '/api',
        serverURL,
      })
      expect(result).toBe('https://example.com/api')
    })

    it('should handle basePath with no adminRoute', () => {
      const result = formatAdminURL({
        adminRoute: undefined,
        basePath: '/api',
        path: '/collections',
        serverURL,
      })
      expect(result).toBe('https://example.com/api/collections')
    })
  })

  describe('path handling', () => {
    it('should handle empty string path', () => {
      const result = formatAdminURL({
        adminRoute: '/admin',
        path: '',
        serverURL,
      })
      expect(result).toBe('https://example.com/admin')
    })

    it('should handle null path', () => {
      const result = formatAdminURL({
        adminRoute: '/admin',
        path: null,
        serverURL,
      })
      expect(result).toBe('https://example.com/admin')
    })

    it('should handle undefined path', () => {
      const result = formatAdminURL({
        adminRoute: '/admin',
        path: undefined,
        serverURL,
      })
      expect(result).toBe('https://example.com/admin')
    })

    it('should handle path with query parameters', () => {
      const result = formatAdminURL({
        adminRoute: '/admin',
        path: '/collections/posts?page=2',
        serverURL,
      })
      expect(result).toBe('https://example.com/admin/collections/posts?page=2')
    })
  })

  describe('edge cases', () => {
    it('should handle empty basePath', () => {
      const result = formatAdminURL({
        adminRoute: '/admin',
        basePath: '',
        path: '/collections/posts',
        serverURL,
      })
      expect(result).toBe('https://example.com/admin/collections/posts')
    })

    it('should return "/" for minimal relative config', () => {
      const result = formatAdminURL({
        adminRoute: undefined,
        basePath: '',
        path: '',
        relative: true,
      })
      expect(result).toBe('/')
    })

    it('should handle complex nested paths', () => {
      const result = formatAdminURL({
        adminRoute: '/admin',
        basePath: '/api/v2',
        path: '/collections/posts/edit/123',
        serverURL,
      })
      expect(result).toBe('https://example.com/api/v2/admin/collections/posts/edit/123')
    })
  })
})
