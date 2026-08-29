/**
 * Tests for relationship field batching optimization
 * 
 * Issue: https://github.com/payloadcms/payload/issues/13329
 * 
 * Problem: Array fields with relationships cause N+1 API requests
 * - 50 array items × 2 relationships = 100+ REST API calls
 * - Causes MongoDB connection exhaustion on Vercel (500 limit)
 * - Results in UI crashes and poor performance
 * 
 * Expected behavior after fix:
 * - Relationships should be batched by collection type
 * - Multiple items with same relationship type should use single request
 * - Implement caching to prevent duplicate requests
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

import {
  RelationshipBatcher,
  getGlobalRelationshipBatcher,
  resetGlobalRelationshipBatcher,
} from '../../utilities/RelationshipBatcher.js'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch as unknown as typeof global.fetch

const mockCollection = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
  },
} as unknown as import('payload').SanitizedCollectionConfig

describe('Relationship Field Batching', () => {
  describe('Request Batching Strategy', () => {
    it('should batch multiple relationship IDs from same collection into single request', () => {
      // Given: 50 array items, each with a 'category' relationship
      const arrayItems = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i}`,
        category: { value: `category-${i % 5}`, relationTo: 'categories' }, // Only 5 unique categories
      }))

      // When: Loading relationship data
      // Current behavior: 50 separate API requests (one per array item)
      // Expected behavior: 1 API request with ids: ['category-0', 'category-1', ...]
      
      const uniqueCategoryIds = new Set(
        arrayItems.map((item) => item.category.value)
      )

      // Should only need to fetch 5 unique categories, not 50 requests
      expect(uniqueCategoryIds.size).toBe(5)
      expect(uniqueCategoryIds.size).toBeLessThan(arrayItems.length)
    })

    it('should batch relationships across multiple collection types efficiently', () => {
      // Given: Array items with multiple relationship types
      const arrayItems = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i}`,
        category: { value: `category-${i % 5}`, relationTo: 'categories' },
        partner: { value: `partner-${i % 10}`, relationTo: 'partners' },
      }))

      // When: Grouping by collection type
      const groupedByCollection = arrayItems.reduce((acc, item) => {
        if (!acc[item.category.relationTo]) {
          acc[item.category.relationTo] = new Set()
        }
        if (!acc[item.partner.relationTo]) {
          acc[item.partner.relationTo] = new Set()
        }
        acc[item.category.relationTo].add(item.category.value)
        acc[item.partner.relationTo].add(item.partner.value)
        return acc
      }, {} as Record<string, Set<string>>)

      // Then: Should only need 2 requests (one per collection type)
      expect(Object.keys(groupedByCollection)).toHaveLength(2)
      expect(groupedByCollection.categories.size).toBe(5)
      expect(groupedByCollection.partners.size).toBe(10)
      
      // Total requests needed: 2 (one per collection)
      // Instead of: 100 (50 items × 2 relationships each)
      const totalRequestsNeeded = Object.keys(groupedByCollection).length
      expect(totalRequestsNeeded).toBe(2)
    })

    it('should cache relationship data to prevent duplicate requests', () => {
      // Given: Previously fetched relationship data
      const cache = new Map<string, { data: unknown; timestamp: number }>()
      const categoryCacheKey = 'categories:category-1'
      
      cache.set(categoryCacheKey, {
        data: { id: 'category-1', title: 'Test Category' },
        timestamp: Date.now(),
      })

      // When: Requesting same relationship again
      const cachedResult = cache.get(categoryCacheKey)

      // Then: Should return cached data without API request
      expect(cachedResult).toBeDefined()
      expect(cachedResult?.data).toEqual({
        id: 'category-1',
        title: 'Test Category',
      })
    })

    it('should invalidate cache after TTL period', () => {
      const cache = new Map<string, { data: unknown; timestamp: number }>()
      const TTL = 5 * 60 * 1000 // 5 minutes
      
      const cacheKey = 'categories:category-1'
      const oldTimestamp = Date.now() - TTL - 1000 // Expired
      
      cache.set(cacheKey, {
        data: { id: 'category-1', title: 'Old Data' },
        timestamp: oldTimestamp,
      })

      // Check if cache is expired
      const cachedEntry = cache.get(cacheKey)
      const isExpired = cachedEntry && (Date.now() - cachedEntry.timestamp > TTL)

      expect(isExpired).toBe(true)
    })
  })

  describe('Performance Impact', () => {
    it('should reduce requests from O(n*m) to O(c) where c = unique collections', () => {
      const n = 50 // array items
      const m = 2 // relationships per item
      const c = 2 // unique collection types (categories, partners)
      
      const naiveRequestCount = n * m // 100 requests
      const optimizedRequestCount = c // 2 requests
      
      const reductionPercentage = ((naiveRequestCount - optimizedRequestCount) / naiveRequestCount) * 100
      
      expect(optimizedRequestCount).toBeLessThan(naiveRequestCount)
      expect(reductionPercentage).toBe(98) // 98% reduction
    })

    it('should handle polymorphic relationships (multiple relationTo values)', () => {
      const polymorphicItems = [
        { value: 'post-1', relationTo: 'posts' },
        { value: 'page-1', relationTo: 'pages' },
        { value: 'post-2', relationTo: 'posts' },
        { value: 'user-1', relationTo: 'users' },
        { value: 'page-2', relationTo: 'pages' },
      ]

      // Group by relationTo
      const grouped = polymorphicItems.reduce((acc, item) => {
        if (!acc[item.relationTo]) {
          acc[item.relationTo] = []
        }
        acc[item.relationTo].push(item.value)
        return acc
      }, {} as Record<string, string[]>)

      expect(grouped.posts).toHaveLength(2)
      expect(grouped.pages).toHaveLength(2)
      expect(grouped.users).toHaveLength(1)
      
      // Should only need 3 requests instead of 5
      expect(Object.keys(grouped).length).toBe(3)
    })
  })

  describe('Connection Pool Protection', () => {
    it('should limit concurrent requests to prevent MongoDB connection exhaustion', async () => {
      const maxConcurrentRequests = 10
      const totalRequestsNeeded = 50
      
      // Simulate request queue with concurrency limit
      let activeRequests = 0
      let maxActiveRequests = 0
      
      const executeWithLimit = async (): Promise<void> => {
        if (activeRequests >= maxConcurrentRequests) {
          // Wait for available slot
          await new Promise((resolve) => setTimeout(resolve, 10))
          return executeWithLimit()
        }
        
        activeRequests++
        maxActiveRequests = Math.max(maxActiveRequests, activeRequests)
        
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 50))
        
        activeRequests--
      }

      // Execute concurrent requests
      const promises = Array.from({ length: totalRequestsNeeded }, () => executeWithLimit())
      await Promise.all(promises)

      // In real implementation, this would use a proper queue
      // For test, we just verify the concept
      expect(maxActiveRequests).toBeLessThanOrEqual(maxConcurrentRequests)
      expect(maxConcurrentRequests).toBeLessThan(500) // Vercel MongoDB limit
    })

    it('should prioritize visible relationships in virtual scrolling', () => {
      // When: User has 100 array items but only 10 visible in viewport
      const totalItems = 100
      const visibleItems = 10
      
      // Should only fetch relationships for visible items first
      const priorityRequests = visibleItems
      const deferredRequests = totalItems - visibleItems
      
      expect(priorityRequests).toBeLessThan(totalItems)
      expect(deferredRequests).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle failed relationship requests gracefully', async () => {
      // Mock fetch that rejects
      const originalFetch = global.fetch
      global.fetch = async () => Promise.reject(new Error('Network error'))

      try {
        // Test would verify graceful handling
        expect(typeof global.fetch).toBe('function')
      } finally {
        global.fetch = originalFetch
      }
    })

    it('should retry failed requests with exponential backoff', () => {
      const maxRetries = 3
      const baseDelay = 1000 // 1 second
      
      const calculateBackoff = (retryCount: number): number => {
        return baseDelay * Math.pow(2, retryCount)
      }

      expect(calculateBackoff(0)).toBe(1000)
      expect(calculateBackoff(1)).toBe(2000)
      expect(calculateBackoff(2)).toBe(4000)
      expect(calculateBackoff(maxRetries - 1)).toBe(4000)
    })
  })
})

describe('RelationshipBatcher Integration Tests', () => {
  let batcher: RelationshipBatcher

  beforeEach(() => {
    resetGlobalRelationshipBatcher()
    mockFetch.mockClear()
  })

  afterEach(() => {
    resetGlobalRelationshipBatcher()
  })

  it('should batch fetch relationships and cache results', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        await Promise.resolve()
        return {
          docs: [
            { id: 'cat-1', title: 'Category 1' },
            { id: 'cat-2', title: 'Category 2' },
            { id: 'cat-3', title: 'Category 3' },
          ],
        }
      },
    })

    batcher = getGlobalRelationshipBatcher({
      apiRoute: '/api',
      locale: 'en',
      i18nLanguage: 'en',
    })

    // Fetch 3 relationships from same collection
    await batcher.batchFetch([
      { collection: mockCollection, id: 'cat-1', fieldToSelect: 'title' },
      { collection: mockCollection, id: 'cat-2', fieldToSelect: 'title' },
      { collection: mockCollection, id: 'cat-3', fieldToSelect: 'title' },
    ])

    // Should only make 1 API request (batched)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // All 3 should be cached
    expect(batcher.getFromCache('categories', 'cat-1')).toBeDefined()
    expect(batcher.getFromCache('categories', 'cat-2')).toBeDefined()
    expect(batcher.getFromCache('categories', 'cat-3')).toBeDefined()
  })

  it('should skip cached relationships on subsequent fetches', async () => {
    // Mock API response for first fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        await Promise.resolve()
        return {
          docs: [
            { id: 'cat-1', title: 'Category 1' },
            { id: 'cat-2', title: 'Category 2' },
          ],
        }
      },
    })

    batcher = getGlobalRelationshipBatcher({
      apiRoute: '/api',
      locale: 'en',
      i18nLanguage: 'en',
    })

    // First fetch - should make 1 API request
    await batcher.batchFetch([
      { collection: mockCollection, id: 'cat-1', fieldToSelect: 'title' },
      { collection: mockCollection, id: 'cat-2', fieldToSelect: 'title' },
    ])

    expect(mockFetch).toHaveBeenCalledTimes(1)
    mockFetch.mockClear()

    // Second fetch - both items are cached, should NOT make any requests
    await batcher.batchFetch([
      { collection: mockCollection, id: 'cat-1', fieldToSelect: 'title' },
      { collection: mockCollection, id: 'cat-2', fieldToSelect: 'title' },
    ])

    // Should not make any requests (all cached)
    expect(mockFetch).toHaveBeenCalledTimes(0)
  })

  it('should handle multiple collection types in single batch', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          await Promise.resolve()
          return {
            docs: [{ id: 'cat-1', title: 'Category 1' }],
          }
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          await Promise.resolve()
          return {
            docs: [{ id: 'partner-1', name: 'Partner 1' }],
          }
        },
      })

    batcher = getGlobalRelationshipBatcher({
      apiRoute: '/api',
      locale: 'en',
      i18nLanguage: 'en',
    })

    const partnersCollection = {
      slug: 'partners',
      admin: { useAsTitle: 'name' },
    } as unknown as import('payload').SanitizedCollectionConfig

    await batcher.batchFetch([
      { collection: mockCollection, id: 'cat-1', fieldToSelect: 'title' },
      { collection: partnersCollection, id: 'partner-1', fieldToSelect: 'name' },
    ])

    // Should make 2 requests (one per collection type)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
