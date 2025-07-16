import type { Args } from '../index.js'

/**
 * Each key is a mongo-compatible database and the value
 * is the recommended `mongooseAdapter` settings for compatability.
 */
export const compatabilityOptions = {
  cosmosdb: {
    transactionOptions: false,
    useJoinAggregations: false,
    usePipelineInSortLookup: false,
  },
  documentdb: {
    disableIndexHints: true,
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
