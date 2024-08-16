import type { TypeWithID } from '../collections/config/types.js'
import type { Count, Find, FindGlobal, FindOne, PaginatedDocs } from '../database/types.js'
import type { PayloadRequest, Where } from '../types/index.js'
import type {
  DatabaseCache,
  DatabaseCacheOptions,
  DatabaseCacheStorage,
  DatabaseCachedFindArgs,
  DatabaseCachedFindGlobalArgs,
  DatabaseCachedFindOneArgs,
  InvalidateCacheFunction,
  TTLResolveFunction,
} from './types.js'

const getCacheHitLogger = ({
  message,
  operation,
  options: { logging },
  req,
}: {
  message: string
  operation: string
  options: DatabaseCacheOptions
  req: PayloadRequest
}) => {
  if (!logging)
    return {
      log: () => {},
      setCacheSkip: () => {},
    }

  const startTime = Date.now()
  let cacheHit = true

  const log = () => {
    const executionTime = Date.now() - startTime
    req.payload.logger.info(
      `Cache: ${cacheHit ? 'HIT' : ' SKIP'}, operation: ${operation}, ${message} (${executionTime} MS)`,
    )
  }

  return {
    log,
    setCacheSkip: () => (cacheHit = false),
  }
}

type SanitizedCacheIndex = {
  field: string
  value: string
}

const sanitizeCachedIndexesFromWhere = (
  cacheIndexes: string[],
  where: Where = {},
): SanitizedCacheIndex[] => {
  let sanitizedIndexes: SanitizedCacheIndex[] = []

  cacheIndexes.forEach((field) => {
    if (where[field]) {
      const value = where[field]['equals']

      if (value) sanitizedIndexes.push({ field, value })
    }
  })

  where.and?.forEach((and) => {
    sanitizedIndexes = [...sanitizedIndexes, ...sanitizeCachedIndexesFromWhere(cacheIndexes, and)]
  })

  where.or?.forEach((or) => {
    sanitizedIndexes = [...sanitizedIndexes, ...sanitizeCachedIndexesFromWhere(cacheIndexes, or)]
  })

  return sanitizedIndexes
}

const tagsWithDraft = (tags: string[], draft?: 'all' | boolean): string[] => {
  let resolvedTags: string[] = []

  if (draft) {
    const draftTags = tags.map((tag) => `${tag}-${draft}`)

    resolvedTags = [...draftTags]

    if (draft === 'all') resolvedTags = [...resolvedTags, ...tags]
  } else resolvedTags = tags

  return resolvedTags
}

const generateFindOneTags = (indexes: SanitizedCacheIndex[], draft?: 'all' | boolean) => {
  return tagsWithDraft(
    indexes.map((index) => `${index.field}-${index.value}`),
    draft,
  )
}

const getTTLResolver = (options: DatabaseCacheOptions) => {
  if (typeof options.ttl === 'function') return options.ttl

  const ttlResolver: TTLResolveFunction = () => {
    if (typeof options.ttl === 'undefined') return 3600000

    return options.ttl as number
  }

  return ttlResolver
}

export const createDatabaseCache = ({
  options = {},
  storage,
}: {
  options: DatabaseCacheOptions
  storage: DatabaseCacheStorage
}): DatabaseCache => {
  const invalidateCache: InvalidateCacheFunction = async (req, { args, draft, operation }) => {
    if (operation === 'updateGlobal') {
      return storage.invalidateTags(tagsWithDraft([`find-global-${args.slug}`], draft))
    }

    await storage.invalidateTags(tagsWithDraft([`find-many-${args.collection}`], draft))

    if (operation === 'create') return

    const cachedIndexes = req.payload.collections[args.collection].config.cacheIndexes

    const indexes = sanitizeCachedIndexesFromWhere(cachedIndexes, args.where)

    await storage.invalidateTags(generateFindOneTags(indexes, draft))
  }

  const ttl = getTTLResolver(options)

  return {
    ...storage,
    count: async (args) => {
      const { collection, req, where } = args
      const keyParts: string[] = ['count', collection, JSON.stringify(where), req.locale]

      const cacheHitLogger = getCacheHitLogger({
        message: `collection: ${collection}`,
        operation: 'count',
        options,
        req,
      })

      const cachedCount = storage.cacheFn<Count>(
        (args) => {
          cacheHitLogger.setCacheSkip()
          return req.payload.db.count(args)
        },
        keyParts,
        [`find-many-${collection}`],
        ttl({ operation: 'count', operationArgs: args }),
      )

      const result = await cachedCount(args)

      cacheHitLogger.log()

      return result
    },
    find: async <T = TypeWithID>(args: DatabaseCachedFindArgs): Promise<PaginatedDocs<T>> => {
      const { collection, draft, limit, page, pagination, req, sort, where } = args

      const keyParts: string[] = [
        'find',
        collection,
        JSON.stringify(where),
        req.locale,
        sort,
        JSON.stringify([limit, pagination, page]),
      ]

      const cacheHitLogger = getCacheHitLogger({
        message: `collection: ${collection}`,
        operation: 'find',
        options,
        req,
      })

      const cachedFind = storage.cacheFn<Find>(
        (args) => {
          cacheHitLogger.setCacheSkip()
          return draft ? req.payload.db.queryDrafts(args) : req.payload.db.find(args)
        },
        keyParts,
        tagsWithDraft([`find-many-${collection}`], draft),
        ttl({ draft, operation: 'find', operationArgs: args }),
      )

      const result = await cachedFind(args)

      cacheHitLogger.log()

      return result as PaginatedDocs<T>
    },
    findGlobal: async <T extends Record<string, unknown>>(
      args: DatabaseCachedFindGlobalArgs,
    ): Promise<T> => {
      const { slug, draft, req } = args

      const keyParts: string[] = [slug, req.locale]

      const cacheHitLogger = getCacheHitLogger({
        message: `global: ${slug}`,
        operation: 'findGlobal',
        options,
        req,
      })

      const cachedFindGlobal = storage.cacheFn<FindGlobal>(
        (args) => {
          cacheHitLogger.setCacheSkip()
          return req.payload.db.findGlobal(args)
        },
        keyParts,
        tagsWithDraft([`find-global-${slug}`], draft),
        ttl({ draft, operation: 'findGlobal', operationArgs: args }),
      )

      const result = await cachedFindGlobal(args)

      cacheHitLogger.log()

      return result
    },
    findOne: async <T = TypeWithID>(args: DatabaseCachedFindOneArgs): Promise<T | null> => {
      const { collection, draft, req, where } = args

      const cacheIndexes = req.payload.collections[collection].config.cacheIndexes

      const keyParts: string[] = [
        'findOne',
        collection,
        JSON.stringify(where),
        req.locale,
        req.locale,
      ]

      const sanitizedCachedIndexes = sanitizeCachedIndexesFromWhere(cacheIndexes, where)

      const cacheHitLogger = getCacheHitLogger({
        message: `collection: ${collection}, indexes: ${sanitizedCachedIndexes.map((index) => `${index.field}: ${index.value}`).join(', ')}`,
        operation: `findOne`,
        options,
        req,
      })

      const cachedFind = storage.cacheFn<FindOne>(
        (args) => {
          cacheHitLogger.setCacheSkip()
          return req.payload.db.findOne(args)
        },
        keyParts,
        generateFindOneTags(sanitizedCachedIndexes, draft),
        ttl({ draft, operation: 'findOne', operationArgs: args }),
      )

      const result = await cachedFind(args)

      cacheHitLogger.log()

      return result as T | null
    },
    invalidateCache,
  }
}
