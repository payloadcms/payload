/**
 * Relationship Data Batching Utility
 *
 * Solves N+1 query problem described in issue #13329:
 * - Arrays with 50 items × 2 relationships = 100+ API requests
 * - Causes MongoDB connection exhaustion on Vercel (500 limit)
 * - Results in UI crashes and poor performance
 *
 * Solution:
 * 1. Batch relationship IDs by collection type
 * 2. Cache fetched relationship data with TTL
 * 3. Limit concurrent requests to prevent connection pool exhaustion
 * 4. Deduplicate IDs to avoid redundant requests
 */

import type { PaginatedDocs, SanitizedCollectionConfig } from 'payload'

import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

// Configuration constants
const DEFAULT_MAX_CONCURRENT_REQUESTS = 10
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 1000 // Prevent memory growth

interface RelationshipCacheEntry {
  data: unknown
  timestamp: number
  ttl: number
}

interface BatchedRelationshipRequest {
  collection: SanitizedCollectionConfig
  ids: string[]
  fieldToSelect: string
}

interface RelationshipBatcherConfig {
  apiRoute: string
  locale: string
  i18nLanguage: string
  maxConcurrentRequests?: number
  cacheTTL?: number // Time to live in milliseconds
}

export class RelationshipBatcher {
  private cache: Map<string, RelationshipCacheEntry>
  private pendingRequests: Map<string, Promise<unknown>>
  private activeRequests: number
  private requestQueue: Array<() => void>

  private readonly apiRoute: string
  private readonly locale: string
  private readonly i18nLanguage: string
  private readonly maxConcurrentRequests: number
  private readonly cacheTTL: number

  constructor(config: RelationshipBatcherConfig) {
    this.cache = new Map()
    this.pendingRequests = new Map()
    this.activeRequests = 0
    this.requestQueue = []

    this.apiRoute = config.apiRoute
    this.locale = config.locale
    this.i18nLanguage = config.i18nLanguage
    this.maxConcurrentRequests =
      config.maxConcurrentRequests || DEFAULT_MAX_CONCURRENT_REQUESTS
    this.cacheTTL = config.cacheTTL || DEFAULT_CACHE_TTL_MS
  }

  /**
   * Generate cache key for a relationship
   */
  private getCacheKey(collection: string, id: string): string {
    return `${collection}:${id}`
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  private isCacheValid(entry: RelationshipCacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  /**
   * Get cached data if available and not expired
   */
  getFromCache(collection: string, id: string): unknown | null {
    const cacheKey = this.getCacheKey(collection, id)
    const entry = this.cache.get(cacheKey)

    if (entry && this.isCacheValid(entry)) {
      return entry.data
    }

    // Remove expired entry
    if (entry) {
      this.cache.delete(cacheKey)
    }

    return null
  }

  /**
   * Set cache entry with timestamp
   * Implements LRU eviction when cache exceeds MAX_CACHE_SIZE
   */
  setCache(collection: string, id: string, data: unknown): void {
    const cacheKey = this.getCacheKey(collection, id)

    // Evict oldest entry if cache is full (LRU strategy)
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: this.cacheTTL,
    })
  }

  /**
   * Execute request with concurrency control
   */
  private async executeWithConcurrencyControl<T>(
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Wait if we're at max concurrency
    if (this.activeRequests >= this.maxConcurrentRequests) {
      await new Promise<void>((resolve) => {
        this.requestQueue.push(resolve)
      })
    }

    this.activeRequests++

    try {
      return await requestFn()
    } finally {
      this.activeRequests--
      
      // Process next queued request
      const next = this.requestQueue.shift()
      if (next) {
        next()
      }
    }
  }

  /**
   * Fetch relationships for a single collection with batching
   */
  async fetchBatch(request: BatchedRelationshipRequest): Promise<unknown[]> {
    const { collection, ids, fieldToSelect } = request

    // Filter out IDs that are already cached
    const idsToFetch = ids.filter((id) => {
      const cached = this.getFromCache(collection.slug, id)
      return cached === null
    })

    // If all IDs are cached, return cached data
    if (idsToFetch.length === 0) {
      return ids.map((id) => this.getFromCache(collection.slug, id))
    }

    // Check if there's already a pending request for this exact batch
    const batchKey = `${collection.slug}:${idsToFetch.sort().join(',')}`
    const pendingRequest = this.pendingRequests.get(batchKey)

    if (pendingRequest) {
      await pendingRequest
    }

    // Create new batched request
    const requestPromise = this.executeWithConcurrencyControl(async () => {
      const query = {
        depth: 0,
        draft: true,
        limit: idsToFetch.length,
        locale: this.locale,
        select: {
          [fieldToSelect]: true,
        },
        where: {
          id: {
            in: idsToFetch,
          },
        },
      }

      const response = await fetch(
        formatAdminURL({
          apiRoute: this.apiRoute,
          path: `/${collection.slug}`,
        }),
        {
          body: qs.stringify(query),
          credentials: 'include',
          headers: {
            'Accept-Language': this.i18nLanguage,
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Payload-HTTP-Method-Override': 'GET',
          },
          method: 'POST',
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch ${collection.slug}: ${response.status}`)
      }

      const data: PaginatedDocs<unknown> = await response.json()
      
      // Cache each document
      data.docs.forEach((doc: any) => {
        if (doc.id) {
          this.setCache(collection.slug, doc.id, doc)
        }
      })

      return data.docs
    })

    this.pendingRequests.set(batchKey, requestPromise)

    try {
      await requestPromise
    } finally {
      this.pendingRequests.delete(batchKey)
    }

    // Return combined results (cached + fetched)
    return ids.map((id) => {
      const cached = this.getFromCache(collection.slug, id)
      if (cached) return cached
      return null
    })
  }

  /**
   * Batch and fetch multiple relationship types efficiently
   *
   * Groups relationships by collection type and fetches them in parallel,
   * respecting concurrency limits to prevent connection pool exhaustion.
   *
   * @param relationships - Array of { collection, id, fieldToSelect }
   * @returns Map of collection slug to fetched documents
   *
   * @example
   * ```typescript
   * const batcher = getGlobalRelationshipBatcher(config)
   * const results = await batcher.batchFetch([
   *   { collection: categoriesConfig, id: 'cat-1', fieldToSelect: 'title' },
   *   { collection: categoriesConfig, id: 'cat-2', fieldToSelect: 'title' },
   *   { collection: partnersConfig, id: 'partner-1', fieldToSelect: 'name' },
   * ])
   * // Makes only 2 requests instead of 3 (batched by collection)
   * ```
   *
   * @throws {Error} If fetch request fails with non-OK status
   */
  async batchFetch(
    relationships: Array<{
      collection: SanitizedCollectionConfig
      id: string
      fieldToSelect: string
    }>
  ): Promise<Map<string, unknown[]>> {
    // Group by collection slug
    const grouped = relationships.reduce((acc, rel) => {
      const key = rel.collection.slug
      if (!acc.has(key)) {
        acc.set(key, {
          collection: rel.collection,
          ids: [],
          fieldToSelect: rel.fieldToSelect,
        })
      }
      acc.get(key)!.ids.push(rel.id)
      return acc
    }, new Map<string, BatchedRelationshipRequest>())

    // Deduplicate IDs within each group
    grouped.forEach((request) => {
      request.ids = Array.from(new Set(request.ids))
    })

    // Fetch all batches in parallel (within concurrency limits)
    const fetchPromises = Array.from(grouped.values()).map((request) =>
      this.fetchBatch(request)
    )

    await Promise.all(fetchPromises)

    // Return results organized by collection
    const results = new Map<string, unknown[]>()
    grouped.forEach((request, collectionSlug) => {
      const docs = request.ids.map((id) => this.getFromCache(collectionSlug, id))
      results.set(collectionSlug, docs.filter(Boolean))
    })

    return results
  }

  /**
   * Clear cache (useful for manual invalidation)
   */
  clearCache(collectionSlug?: string): void {
    if (collectionSlug) {
      // Clear specific collection
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${collectionSlug}:`)) {
          this.cache.delete(key)
        }
      }
    } else {
      // Clear all
      this.cache.clear()
    }
  }

  /**
   * Get cache statistics (useful for debugging)
   */
  getStats(): {
    size: number
    activeRequests: number
    queuedRequests: number
  } {
    return {
      size: this.cache.size,
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length,
    }
  }
}

/**
 * Singleton instance for global relationship batching
 * Initialized once per admin session
 */
let globalBatcher: RelationshipBatcher | null = null

export function getGlobalRelationshipBatcher(
  config?: RelationshipBatcherConfig
): RelationshipBatcher {
  if (!globalBatcher && config) {
    globalBatcher = new RelationshipBatcher(config)
  }

  if (!globalBatcher) {
    throw new Error(
      'RelationshipBatcher not initialized. Call getGlobalRelationshipBatcher with config first.'
    )
  }

  return globalBatcher
}

export function resetGlobalRelationshipBatcher(): void {
  globalBatcher = null
}
