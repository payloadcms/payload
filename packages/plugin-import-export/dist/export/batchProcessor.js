/**
 * Export-specific batch processor for processing documents in batches during export.
 * Uses the generic batch processing utilities from useBatchProcessor.
 */ /**
 * Creates an export batch processor with the specified options.
 *
 * @param options - Configuration options for the batch processor
 * @returns An object containing the processExport method
 *
 * @example
 * ```ts
 * const processor = createExportBatchProcessor({ batchSize: 100, debug: true })
 *
 * const result = await processor.processExport({
 *   collectionSlug: 'posts',
 *   findArgs: { collection: 'posts', depth: 1, draft: false, limit: 100, overrideAccess: false },
 *   format: 'csv',
 *   maxDocs: 1000,
 *   req,
 *   transformDoc: (doc) => flattenObject({ doc }),
 * })
 * ```
 */ export function createExportBatchProcessor(options = {}) {
    const batchSize = options.batchSize ?? 100;
    const debug = options.debug ?? false;
    /**
   * Process an export operation by fetching and transforming documents in batches.
   *
   * @param processOptions - Options for the export operation
   * @returns The export result containing transformed documents and column info
   */ const processExport = async (processOptions)=>{
        const { findArgs, format, maxDocs, req, startPage = 1, transformDoc } = processOptions;
        const docs = [];
        const columnsSet = new Set();
        const columns = [];
        let currentPage = startPage;
        let fetched = 0;
        let hasNextPage = true;
        while(hasNextPage){
            const remaining = Math.max(0, maxDocs - fetched);
            if (remaining === 0) {
                break;
            }
            const result = await req.payload.find({
                ...findArgs,
                limit: Math.min(batchSize, remaining),
                page: currentPage
            });
            if (debug) {
                req.payload.logger.debug(`Processing export batch ${currentPage} with ${result.docs.length} documents`);
            }
            for (const doc of result.docs){
                const transformedDoc = transformDoc(doc);
                docs.push(transformedDoc);
                // Track columns for CSV format
                if (format === 'csv') {
                    for (const key of Object.keys(transformedDoc)){
                        if (!columnsSet.has(key)) {
                            columnsSet.add(key);
                            columns.push(key);
                        }
                    }
                }
            }
            fetched += result.docs.length;
            hasNextPage = result.hasNextPage && fetched < maxDocs;
            currentPage++;
        }
        return {
            columns,
            docs,
            fetchedCount: fetched
        };
    };
    /**
   * Async generator for streaming export - yields batches instead of collecting all.
   * Useful for streaming exports where you want to process batches as they're fetched.
   *
   * @param processOptions - Options for the export operation
   * @yields Batch results containing transformed documents and discovered columns
   *
   * @example
   * ```ts
   * const processor = createExportBatchProcessor({ batchSize: 100 })
   *
   * for await (const batch of processor.streamExport({ ... })) {
   *   // Process each batch as it's yielded
   *   console.log(`Got ${batch.docs.length} documents`)
   * }
   * ```
   */ async function* streamExport(processOptions) {
        const { findArgs, format, maxDocs, req, startPage = 1, transformDoc } = processOptions;
        const columnsSet = new Set();
        const columns = [];
        let currentPage = startPage;
        let fetched = 0;
        let hasNextPage = true;
        while(hasNextPage){
            const remaining = Math.max(0, maxDocs - fetched);
            if (remaining === 0) {
                break;
            }
            const result = await req.payload.find({
                ...findArgs,
                limit: Math.min(batchSize, remaining),
                page: currentPage
            });
            if (debug) {
                req.payload.logger.debug(`Streaming export batch ${currentPage} with ${result.docs.length} documents`);
            }
            const batchDocs = [];
            for (const doc of result.docs){
                const transformedDoc = transformDoc(doc);
                batchDocs.push(transformedDoc);
                // Track columns for CSV format
                if (format === 'csv') {
                    for (const key of Object.keys(transformedDoc)){
                        if (!columnsSet.has(key)) {
                            columnsSet.add(key);
                            columns.push(key);
                        }
                    }
                }
            }
            yield {
                columns: [
                    ...columns
                ],
                docs: batchDocs
            };
            fetched += result.docs.length;
            hasNextPage = result.hasNextPage && fetched < maxDocs;
            currentPage++;
        }
    }
    /**
   * Discover all columns from the dataset by scanning through all batches.
   * Useful for CSV exports where you need to know all columns before streaming.
   *
   * @param processOptions - Options for the export operation
   * @returns Array of discovered column names
   */ const discoverColumns = async (processOptions)=>{
        const { findArgs, maxDocs, req, startPage = 1, transformDoc } = processOptions;
        const columnsSet = new Set();
        const columns = [];
        let currentPage = startPage;
        let fetched = 0;
        let hasNextPage = true;
        while(hasNextPage){
            const remaining = Math.max(0, maxDocs - fetched);
            if (remaining === 0) {
                break;
            }
            const result = await req.payload.find({
                ...findArgs,
                limit: Math.min(batchSize, remaining),
                page: currentPage
            });
            if (debug) {
                req.payload.logger.debug(`Scanning columns from batch ${currentPage} with ${result.docs.length} documents`);
            }
            for (const doc of result.docs){
                const transformedDoc = transformDoc(doc);
                for (const key of Object.keys(transformedDoc)){
                    if (!columnsSet.has(key)) {
                        columnsSet.add(key);
                        columns.push(key);
                    }
                }
            }
            fetched += result.docs.length;
            hasNextPage = result.hasNextPage && fetched < maxDocs;
            currentPage++;
        }
        if (debug) {
            req.payload.logger.debug(`Discovered ${columns.length} columns`);
        }
        return columns;
    };
    return {
        discoverColumns,
        processExport,
        streamExport
    };
}

//# sourceMappingURL=batchProcessor.js.map