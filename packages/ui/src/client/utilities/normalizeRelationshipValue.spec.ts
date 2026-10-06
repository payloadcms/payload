import { describe, it, expect } from 'vitest'
import { normalizeRelationshipValue } from './normalizeRelationshipValue.js'

describe('normalizeRelationshipValue', () => {
  describe('Monomorphic relationships (string relationTo)', () => {
    const relationTo = 'users'

    it('should return simple string ID as-is', () => {
      const result = normalizeRelationshipValue('user123', relationTo)
      expect(result).toBe('user123')
    })

    it('should return simple number ID as-is', () => {
      const result = normalizeRelationshipValue(123, relationTo)
      expect(result).toBe(123)
    })

    it('should extract ID from object with relationTo and value', () => {
      const value = { relationTo: 'users', value: 'user456' }
      const result = normalizeRelationshipValue(value, relationTo)
      expect(result).toBe('user456')
    })

    it('should extract ID from nested value structure', () => {
      const value = {
        relationTo: 'users',
        value: {
          value: 'user789',
        },
      }
      const result = normalizeRelationshipValue(value, relationTo)
      expect(result).toBe('user789')
    })

    it('should extract ID from deeply nested value structure', () => {
      const value = {
        relationTo: 'users',
        value: {
          value: {
            value: 'user999',
          },
        },
      }
      const result = normalizeRelationshipValue(value, relationTo)
      expect(result).toBe('user999')
    })

    it('should extract ID from populated document', () => {
      const value = {
        relationTo: 'users',
        value: {
          id: 'user111',
          name: 'John Doe',
          email: 'john@example.com',
        },
      }
      const result = normalizeRelationshipValue(value, relationTo)
      expect(result).toBe('user111')
    })

    it('should extract ID from populated document without relationTo wrapper', () => {
      const value = {
        id: 'user222',
        name: 'Jane Doe',
        email: 'jane@example.com',
      }
      const result = normalizeRelationshipValue(value, relationTo)
      expect(result).toBe('user222')
    })

    it('should handle null values', () => {
      const result = normalizeRelationshipValue(null, relationTo)
      expect(result).toBeNull()
    })

    it('should handle undefined values', () => {
      const result = normalizeRelationshipValue(undefined, relationTo)
      expect(result).toBeUndefined()
    })

    it('should handle empty object', () => {
      const result = normalizeRelationshipValue({}, relationTo)
      expect(result).toEqual({})
    })
  })

  describe('Polymorphic relationships (array relationTo)', () => {
    const relationTo = ['users', 'posts', 'pages']

    it('should return simple string ID as-is', () => {
      const result = normalizeRelationshipValue('user123', relationTo)
      expect(result).toBe('user123')
    })

    it('should return simple number ID as-is', () => {
      const result = normalizeRelationshipValue(456, relationTo)
      expect(result).toBe(456)
    })

    it('should preserve relationTo structure with string value', () => {
      const value = { relationTo: 'users', value: 'user789' }
      const result = normalizeRelationshipValue(value, relationTo)
      expect(result).toEqual({ relationTo: 'users', value: 'user789' })
    })

    it('should preserve relationTo structure with number value', () => {
      const value = { relationTo: 'posts', value: 123 }
      const result = normalizeRelationshipValue(value, relationTo)
      expect(result).toEqual({ relationTo: 'posts', value: 123 })
    })

    it('should extract ID from nested value structure', () => {
      const value = {
        relationTo: 'posts',
        value: {
          value: 'post456',
        },
      }
      const result = normalizeRelationshipValue(value, relationTo)
      expect(result).toEqual({ relationTo: 'posts', value: 'post456' })
    })

    it('should extract ID from deeply nested value structure', () => {
      const value = {
        relationTo: 'pages',
        value: {
          value: {
            value: 'page789',
          },
        },
      }
      const result = normalizeRelationshipValue(value, relationTo)
      expect(result).toEqual({ relationTo: 'pages', value: 'page789' })
    })

    it('should extract ID from populated document', () => {
      const value = {
        relationTo: 'users',
        value: {
          id: 'user999',
          name: 'John Smith',
          email: 'john.smith@example.com',
        },
      }
      const result = normalizeRelationshipValue(value, relationTo)
      expect(result).toEqual({ relationTo: 'users', value: 'user999' })
    })

    it('should extract ID from complex populated document', () => {
      const value = {
        relationTo: 'posts',
        value: {
          id: 'post123',
          title: 'My Post',
          author: {
            id: 'author456',
            name: 'Author Name',
          },
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      }
      const result = normalizeRelationshipValue(value, relationTo)
      expect(result).toEqual({ relationTo: 'posts', value: 'post123' })
    })

    it('should handle different relationTo values', () => {
      const values = [
        { relationTo: 'users', value: 'user1' },
        { relationTo: 'posts', value: 'post2' },
        { relationTo: 'pages', value: 'page3' },
      ]

      const results = values.map((v) => normalizeRelationshipValue(v, relationTo))

      expect(results).toEqual([
        { relationTo: 'users', value: 'user1' },
        { relationTo: 'posts', value: 'post2' },
        { relationTo: 'pages', value: 'page3' },
      ])
    })

    it('should handle null values', () => {
      const result = normalizeRelationshipValue(null, relationTo)
      expect(result).toBeNull()
    })

    it('should handle undefined values', () => {
      const result = normalizeRelationshipValue(undefined, relationTo)
      expect(result).toBeUndefined()
    })

    it('should extract ID from populated document without relationTo wrapper', () => {
      const value = {
        id: 'doc123',
        title: 'Document Title',
      }
      const result = normalizeRelationshipValue(value, relationTo)
      expect(result).toBe('doc123')
    })
  })

  describe('Edge cases', () => {
    it('should handle object with only value property (no relationTo)', () => {
      const value = { value: 'someValue' }
      const result = normalizeRelationshipValue(value, 'users')
      // Since there's no 'id' field and no relationTo, it should return the value as-is
      expect(result).toEqual({ value: 'someValue' })
    })

    it('should handle object with relationTo but no value', () => {
      const value = { relationTo: 'users' }
      const result = normalizeRelationshipValue(value, ['users', 'posts'])
      expect(result).toEqual({ relationTo: 'users' })
    })

    it('should handle empty array relationTo', () => {
      const result = normalizeRelationshipValue('user123', [])
      expect(result).toBe('user123')
    })

    it('should handle single-item array relationTo as polymorphic', () => {
      const value = { relationTo: 'users', value: 'user123' }
      const result = normalizeRelationshipValue(value, ['users'])
      expect(result).toEqual({ relationTo: 'users', value: 'user123' })
    })

    it('should handle numeric IDs in populated documents', () => {
      const value = {
        relationTo: 'users',
        value: {
          id: 12345,
          name: 'User with numeric ID',
        },
      }
      const result = normalizeRelationshipValue(value, ['users', 'posts'])
      expect(result).toEqual({ relationTo: 'users', value: 12345 })
    })

    it('should handle nested null values', () => {
      const value = {
        relationTo: 'users',
        value: null,
      }
      const result = normalizeRelationshipValue(value, 'users')
      expect(result).toBeNull()
    })

    it('should handle zero as a valid ID', () => {
      const result = normalizeRelationshipValue(0, 'users')
      expect(result).toBe(0)
    })

    it('should handle empty string as a valid ID', () => {
      const result = normalizeRelationshipValue('', 'users')
      expect(result).toBe('')
    })

    it('should handle false as a value', () => {
      const result = normalizeRelationshipValue(false, 'users')
      expect(result).toBe(false)
    })

    it('should handle array values (return as-is)', () => {
      const result = normalizeRelationshipValue(['user1', 'user2'], 'users')
      expect(result).toEqual(['user1', 'user2'])
    })
  })

  describe('Real-world scenarios', () => {
    it('should normalize upload field value for monomorphic upload', () => {
      // Upload field with populated media document
      const value = {
        id: 'media123',
        filename: 'image.jpg',
        mimeType: 'image/jpeg',
        filesize: 12345,
        url: '/media/image.jpg',
      }
      const result = normalizeRelationshipValue(value, 'media')
      expect(result).toBe('media123')
    })

    it('should normalize upload field value for polymorphic upload', () => {
      // Upload field with relationTo structure
      const value = {
        relationTo: 'images',
        value: {
          id: 'image456',
          filename: 'photo.png',
          url: '/media/photo.png',
        },
      }
      const result = normalizeRelationshipValue(value, ['images', 'videos'])
      expect(result).toEqual({ relationTo: 'images', value: 'image456' })
    })

    it('should normalize form submission data', () => {
      // Data coming from form with populated relationship
      const value = {
        relationTo: 'posts',
        value: {
          id: 'post789',
          title: 'Blog Post Title',
          author: { id: 'author123', name: 'Author' },
          publishedDate: '2023-12-01',
        },
      }
      const result = normalizeRelationshipValue(value, ['posts', 'pages'])
      expect(result).toEqual({ relationTo: 'posts', value: 'post789' })
    })

    it('should normalize API response with nested relationships', () => {
      // Complex nested structure from API
      const value = {
        relationTo: 'categories',
        value: {
          value: {
            id: 'cat123',
            name: 'Category Name',
          },
        },
      }
      const result = normalizeRelationshipValue(value, ['categories', 'tags'])
      expect(result).toEqual({ relationTo: 'categories', value: 'cat123' })
    })

    it('should handle table cell data normalization', () => {
      // Cell data from table that might be just an ID
      const simpleValue = 'user123'
      const result = normalizeRelationshipValue(simpleValue, 'users')
      expect(result).toBe('user123')

      // Cell data with full structure
      const complexValue = {
        relationTo: 'users',
        value: {
          id: 'user456',
          name: 'John Doe',
        },
      }
      const result2 = normalizeRelationshipValue(complexValue, ['users', 'admins'])
      expect(result2).toEqual({ relationTo: 'users', value: 'user456' })
    })
  })
})
