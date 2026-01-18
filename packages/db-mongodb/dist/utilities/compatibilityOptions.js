/**
 * Each key is a mongo-compatible database and the value
 * is the recommended `mongooseAdapter` settings for compatibility.
 */ export const compatibilityOptions = {
    cosmosdb: {
        bulkOperationsSingleTransaction: true,
        transactionOptions: false,
        useJoinAggregations: false,
        usePipelineInSortLookup: false
    },
    documentdb: {
        bulkOperationsSingleTransaction: true,
        disableIndexHints: true,
        useJoinAggregations: false
    },
    firestore: {
        disableIndexHints: true,
        ensureIndexes: false,
        transactionOptions: false,
        useAlternativeDropDatabase: true,
        useBigIntForNumberIDs: true,
        useJoinAggregations: false,
        usePipelineInSortLookup: false
    }
};

//# sourceMappingURL=compatibilityOptions.js.map