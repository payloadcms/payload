import type { DatabaseAdapter } from 'payload'

export const compatabilityOptions = {
  firestore: {
    disableIndexHints: true,
    ensureIndexes: false,
    useAlternativeDropDatabase: true,
    useBigIntForNumberIDs: true,
    useJoinAggregations: false,
    usePipelineInSortLookup: false,
  } satisfies Partial<DatabaseAdapter>,
}
