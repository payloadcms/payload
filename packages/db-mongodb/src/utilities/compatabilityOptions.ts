import type { DatabaseAdapter } from 'payload'

/**
 * Each key is a mongo-compatible database and the value
 * is the recommended `mongooseAdapter` settings for compatability.
 */
export const compatabilityOptions = {
  firestore: {
    disableIndexHints: true,
    ensureIndexes: false,
    useAlternativeDropDatabase: true,
    useBigIntForNumberIDs: true,
    useJoinAggregations: false,
    usePipelineInSortLookup: false,
  },
} satisfies Record<string, Partial<DatabaseAdapter>>
