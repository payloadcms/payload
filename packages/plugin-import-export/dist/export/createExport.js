/* eslint-disable perfectionist/sort-objects */ import { stringify } from 'csv-stringify/sync';
import { APIError } from 'payload';
import { Readable } from 'stream';
import { buildDisabledFieldRegex } from '../utilities/buildDisabledFieldRegex.js';
import { flattenObject } from '../utilities/flattenObject.js';
import { getExportFieldFunctions } from '../utilities/getExportFieldFunctions.js';
import { getFilename } from '../utilities/getFilename.js';
import { getSchemaColumns, mergeColumns } from '../utilities/getSchemaColumns.js';
import { getSelect } from '../utilities/getSelect.js';
import { validateLimitValue } from '../utilities/validateLimitValue.js';
import { createExportBatchProcessor } from './batchProcessor.js';
export const createExport = async (args)=>{
    const { id, name: nameArg, batchSize = 100, collectionSlug, debug = false, download, drafts: draftsFromInput, exportsCollection, fields, format, limit: incomingLimit, locale: localeFromInput, page, req, sort, userCollection, userID, where: whereFromInput = {} } = args;
    const { locale: localeFromReq, payload } = req;
    if (debug) {
        req.payload.logger.debug({
            message: 'Starting export process with args:',
            collectionSlug,
            draft: draftsFromInput,
            fields,
            format
        });
    }
    const locale = localeFromInput ?? localeFromReq;
    const collectionConfig = payload.config.collections.find(({ slug })=>slug === collectionSlug);
    if (!collectionConfig) {
        throw new APIError(`Collection with slug ${collectionSlug} not found.`);
    }
    let user;
    if (userCollection && userID) {
        user = await req.payload.findByID({
            id: userID,
            collection: userCollection,
            overrideAccess: true
        });
    }
    if (!user && req.user) {
        user = req?.user?.id ? req.user : req?.user?.user;
    }
    if (!user) {
        throw new APIError('User authentication is required to create exports.');
    }
    const draft = draftsFromInput === 'yes';
    const hasVersions = Boolean(collectionConfig.versions);
    // Only filter by _status for versioned collections
    const publishedWhere = hasVersions ? {
        _status: {
            equals: 'published'
        }
    } : {};
    const where = {
        and: [
            whereFromInput,
            draft ? {} : publishedWhere
        ]
    };
    const name = `${nameArg ?? `${getFilename()}-${collectionSlug}`}.${format}`;
    const isCSV = format === 'csv';
    const select = Array.isArray(fields) && fields.length > 0 ? getSelect(fields) : undefined;
    if (debug) {
        req.payload.logger.debug({
            message: 'Export configuration:',
            name,
            isCSV,
            locale
        });
    }
    const hardLimit = typeof incomingLimit === 'number' && incomingLimit > 0 ? incomingLimit : undefined;
    // Try to count documents - if access is denied, treat as 0 documents
    let totalDocs = 0;
    let accessDenied = false;
    try {
        const countResult = await payload.count({
            collection: collectionSlug,
            user,
            locale,
            overrideAccess: false
        });
        totalDocs = countResult.totalDocs;
    } catch (error) {
        // Access denied - user can't read from this collection
        // We'll create an empty export file
        accessDenied = true;
        if (debug) {
            req.payload.logger.debug({
                message: 'Access denied for collection, creating empty export',
                collectionSlug
            });
        }
    }
    const totalPages = Math.max(1, Math.ceil(totalDocs / batchSize));
    const requestedPage = page || 1;
    const adjustedPage = requestedPage > totalPages ? 1 : requestedPage;
    const findArgs = {
        collection: collectionSlug,
        depth: 1,
        draft,
        limit: batchSize,
        locale,
        overrideAccess: false,
        page: 0,
        select,
        sort,
        user,
        where
    };
    if (debug) {
        req.payload.logger.debug({
            message: 'Find arguments:',
            findArgs
        });
    }
    const toCSVFunctions = getExportFieldFunctions({
        fields: collectionConfig.flattenedFields
    });
    const disabledFields = collectionConfig.admin?.custom?.['plugin-import-export']?.disabledFields ?? [];
    const disabledRegexes = disabledFields.map(buildDisabledFieldRegex);
    const filterDisabledCSV = (row)=>{
        const filtered = {};
        for (const [key, value] of Object.entries(row)){
            const isDisabled = disabledRegexes.some((regex)=>regex.test(key));
            if (!isDisabled) {
                filtered[key] = value;
            }
        }
        return filtered;
    };
    const filterDisabledJSON = (doc, parentPath = '')=>{
        if (Array.isArray(doc)) {
            return doc.map((item)=>filterDisabledJSON(item, parentPath));
        }
        if (typeof doc !== 'object' || doc === null) {
            return doc;
        }
        const filtered = {};
        for (const [key, value] of Object.entries(doc)){
            const currentPath = parentPath ? `${parentPath}.${key}` : key;
            // Only remove if this exact path is disabled
            const isDisabled = disabledFields.includes(currentPath);
            if (!isDisabled) {
                filtered[key] = filterDisabledJSON(value, currentPath);
            }
        }
        return filtered;
    };
    if (download) {
        const limitErrorMsg = validateLimitValue(incomingLimit, req.t);
        if (limitErrorMsg) {
            throw new APIError(limitErrorMsg);
        }
        // Get schema-based columns first (provides base ordering and handles empty exports)
        let schemaColumns = [];
        if (isCSV) {
            const localeCodes = locale === 'all' && payload.config.localization ? payload.config.localization.localeCodes : undefined;
            schemaColumns = getSchemaColumns({
                collectionConfig,
                disabledFields,
                fields,
                locale,
                localeCodes
            });
            if (debug) {
                req.payload.logger.debug({
                    columnCount: schemaColumns.length,
                    msg: 'Schema-based column inference complete'
                });
            }
        }
        // allColumns will be finalized after first batch (schema + data columns merged)
        let allColumns = [];
        let columnsFinalized = false;
        const encoder = new TextEncoder();
        let isFirstBatch = true;
        let streamPage = adjustedPage;
        let fetched = 0;
        const maxDocs = typeof hardLimit === 'number' ? hardLimit : Number.POSITIVE_INFINITY;
        const stream = new Readable({
            async read () {
                const remaining = Math.max(0, maxDocs - fetched);
                if (remaining === 0) {
                    if (!isCSV) {
                        // If first batch with no remaining, output empty array; otherwise just close
                        this.push(encoder.encode(isFirstBatch ? '[]' : ']'));
                    }
                    this.push(null);
                    return;
                }
                const result = await payload.find({
                    ...findArgs,
                    page: streamPage,
                    limit: Math.min(batchSize, remaining)
                });
                if (debug) {
                    req.payload.logger.debug(`Streaming batch ${streamPage} with ${result.docs.length} docs`);
                }
                if (result.docs.length === 0) {
                    // Close JSON array properly if JSON
                    if (!isCSV) {
                        // If first batch with no docs, output empty array; otherwise just close
                        this.push(encoder.encode(isFirstBatch ? '[]' : ']'));
                    }
                    this.push(null);
                    return;
                }
                if (isCSV) {
                    // --- CSV Streaming ---
                    const batchRows = result.docs.map((doc)=>filterDisabledCSV(flattenObject({
                            doc,
                            fields,
                            toCSVFunctions
                        })));
                    // On first batch, discover additional columns from data and merge with schema
                    if (!columnsFinalized) {
                        const dataColumns = [];
                        const seenCols = new Set();
                        for (const row of batchRows){
                            for (const key of Object.keys(row)){
                                if (!seenCols.has(key)) {
                                    seenCols.add(key);
                                    dataColumns.push(key);
                                }
                            }
                        }
                        // Merge schema columns with data-discovered columns
                        allColumns = mergeColumns(schemaColumns, dataColumns);
                        columnsFinalized = true;
                        if (debug) {
                            req.payload.logger.debug({
                                dataColumnsCount: dataColumns.length,
                                finalColumnsCount: allColumns.length,
                                msg: 'Merged schema and data columns'
                            });
                        }
                    }
                    const paddedRows = batchRows.map((row)=>{
                        const fullRow = {};
                        for (const col of allColumns){
                            fullRow[col] = row[col] ?? '';
                        }
                        return fullRow;
                    });
                    const csvString = stringify(paddedRows, {
                        header: isFirstBatch,
                        columns: allColumns
                    });
                    this.push(encoder.encode(csvString));
                } else {
                    // --- JSON Streaming ---
                    const batchRows = result.docs.map((doc)=>filterDisabledJSON(doc));
                    // Convert each filtered/flattened row into JSON string
                    const batchJSON = batchRows.map((row)=>JSON.stringify(row)).join(',');
                    if (isFirstBatch) {
                        this.push(encoder.encode('[' + batchJSON));
                    } else {
                        this.push(encoder.encode(',' + batchJSON));
                    }
                }
                fetched += result.docs.length;
                isFirstBatch = false;
                streamPage += 1; // Increment stream page for the next batch
                if (!result.hasNextPage || fetched >= maxDocs) {
                    if (debug) {
                        req.payload.logger.debug('Stream complete - no more pages');
                    }
                    if (!isCSV) {
                        this.push(encoder.encode(']'));
                    }
                    this.push(null); // End the stream
                }
            }
        });
        return new Response(Readable.toWeb(stream), {
            headers: {
                'Content-Disposition': `attachment; filename="${name}"`,
                'Content-Type': isCSV ? 'text/csv' : 'application/json'
            }
        });
    }
    // Non-download path (buffered export)
    if (debug) {
        req.payload.logger.debug('Starting file generation');
    }
    // Create export batch processor
    const processor = createExportBatchProcessor({
        batchSize,
        debug
    });
    // Transform function based on format
    const transformDoc = (doc)=>isCSV ? filterDisabledCSV(flattenObject({
            doc,
            fields,
            toCSVFunctions
        })) : filterDisabledJSON(doc);
    // Skip fetching if access was denied - we'll create an empty export
    let exportResult = {
        columns: [],
        docs: [],
        fetchedCount: 0
    };
    if (!accessDenied) {
        exportResult = await processor.processExport({
            collectionSlug,
            findArgs: findArgs,
            format,
            maxDocs: typeof hardLimit === 'number' ? hardLimit : Number.POSITIVE_INFINITY,
            req,
            startPage: adjustedPage,
            transformDoc
        });
    }
    const { columns: dataColumns, docs: rows } = exportResult;
    const outputData = [];
    // Prepare final output
    if (isCSV) {
        // Get schema-based columns for consistent ordering
        const localeCodes = locale === 'all' && payload.config.localization ? payload.config.localization.localeCodes : undefined;
        const schemaColumns = getSchemaColumns({
            collectionConfig,
            disabledFields,
            fields,
            locale,
            localeCodes
        });
        // Merge schema columns with data-discovered columns
        // Schema provides ordering, data provides additional columns (e.g., array indices > 0)
        const finalColumns = mergeColumns(schemaColumns, dataColumns);
        const paddedRows = rows.map((row)=>{
            const fullRow = {};
            for (const col of finalColumns){
                fullRow[col] = row[col] ?? '';
            }
            return fullRow;
        });
        // Always output CSV with header, even if empty
        outputData.push(stringify(paddedRows, {
            header: true,
            columns: finalColumns
        }));
    } else {
        // JSON format
        outputData.push(rows.map((doc)=>JSON.stringify(doc)).join(',\n'));
    }
    // Ensure we always have valid content for the file
    // For JSON, empty exports produce "[]"
    // For CSV, if completely empty (no columns, no rows), produce at least a newline to ensure file creation
    const content = format === 'json' ? `[${outputData.join(',')}]` : outputData.join('');
    const buffer = Buffer.from(content.length > 0 ? content : '\n');
    if (debug) {
        req.payload.logger.debug(`${format} file generation complete`);
    }
    if (!id) {
        if (debug) {
            req.payload.logger.debug('Creating new export file');
        }
        req.file = {
            name,
            data: buffer,
            mimetype: isCSV ? 'text/csv' : 'application/json',
            size: buffer.length
        };
    } else {
        if (debug) {
            req.payload.logger.debug(`Updating existing export with id: ${id}`);
        }
        await req.payload.update({
            id,
            collection: exportsCollection,
            data: {},
            file: {
                name,
                data: buffer,
                mimetype: isCSV ? 'text/csv' : 'application/json',
                size: buffer.length
            },
            // Override access only here so that we can be sure the export collection itself is updated as expected
            overrideAccess: true,
            req
        });
    }
    if (debug) {
        req.payload.logger.debug('Export process completed successfully');
    }
};

//# sourceMappingURL=createExport.js.map