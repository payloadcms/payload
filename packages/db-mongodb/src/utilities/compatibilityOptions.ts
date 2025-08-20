import type { Args } from '../index.js'

/**
 * Each key is a mongo-compatible database and the value
 * is the recommended `mongooseAdapter` settings for compatibility.
 */
export const compatibilityOptions = {
  cosmosdb: {
    transactionOptions: false,
    useJoinAggregations: false,
    usePipelineInSortLookup: false,
  },
  documentdb: {
    disableIndexHints: true,
    useJoinAggregations: false,
  },
  firestore: {
    disableIndexHints: true,
    ensureIndexes: false,
    transactionOptions: false,
    useAlternativeDropDatabase: true,
    useBigIntForNumberIDs: true,
    useJoinAggregations: false,
    usePipelineInSortLookup: false,
  },
} satisfies Record<string, Partial<Args>>
