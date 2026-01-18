import { categorizeError, createBatches, extractErrorMessage } from '../utilities/useBatchProcessor.js';
// Helper function to handle multi-locale data
function extractMultiLocaleData(data, configuredLocales) {
    const flatData = {};
    const localeUpdates = {};
    let hasMultiLocale = false;
    // If no locales configured, skip multi-locale processing
    if (!configuredLocales || configuredLocales.length === 0) {
        return {
            flatData: {
                ...data
            },
            hasMultiLocale: false,
            localeUpdates: {}
        };
    }
    const localeSet = new Set(configuredLocales);
    for (const [key, value] of Object.entries(data)){
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const valueObj = value;
            // Check if this object has keys matching configured locales
            const localeKeys = Object.keys(valueObj).filter((k)=>localeSet.has(k));
            if (localeKeys.length > 0) {
                hasMultiLocale = true;
                // This is a localized field with explicit locale keys
                // Use the first locale for initial creation, then update others
                const firstLocale = localeKeys[0];
                if (firstLocale) {
                    flatData[key] = valueObj[firstLocale];
                    // Store other locales for later update
                    for (const locale of localeKeys){
                        if (locale !== firstLocale) {
                            if (!localeUpdates[locale]) {
                                localeUpdates[locale] = {};
                            }
                            localeUpdates[locale][key] = valueObj[locale];
                        }
                    }
                }
            } else {
                // Not locale data, keep as is
                flatData[key] = value;
            }
        } else {
            // Not an object, keep as is. this includes localized fields without locale suffix; ie default locale
            flatData[key] = value;
        }
    }
    return {
        flatData,
        hasMultiLocale,
        localeUpdates
    };
}
async function processImportBatch({ batch, batchIndex, collectionSlug, importMode, matchField, options, req, user }) {
    const result = {
        failed: [],
        successful: []
    };
    // Check if the collection has versions enabled
    const collectionConfig = req.payload.collections[collectionSlug]?.config;
    const collectionHasVersions = Boolean(collectionConfig?.versions);
    // Get configured locales for multi-locale data detection
    const configuredLocales = req.payload.config.localization ? req.payload.config.localization.localeCodes : undefined;
    // Calculate the starting row number for this batch
    const startingRowNumber = batchIndex * options.batchSize;
    for(let i = 0; i < batch.length; i++){
        const document = batch[i];
        if (!document) {
            continue;
        }
        const rowNumber = startingRowNumber + i + 1;
        try {
            let processedDoc;
            let existing;
            if (importMode === 'create') {
                // Remove ID field when creating new document
                const createData = {
                    ...document
                };
                delete createData.id;
                // Only handle _status for versioned collections
                let draftOption;
                if (collectionHasVersions) {
                    // Check if _status is set - use defaultVersionStatus from config
                    // If no _status field provided, use the configured default
                    const statusValue = createData._status || options.defaultVersionStatus;
                    const isPublished = statusValue !== 'draft';
                    draftOption = !isPublished;
                    // Debug: log status handling
                    if (req.payload.config.debug) {
                        req.payload.logger.info({
                            _status: createData._status,
                            isPublished,
                            msg: 'Status handling in create',
                            willSetDraft: draftOption
                        });
                    }
                    delete createData._status; // Remove _status from data - it's controlled via draft option
                }
                // Debug: log what we're about to create
                if (req.payload.config.debug && 'title' in createData) {
                    req.payload.logger.info({
                        msg: 'Creating document',
                        title: createData.title,
                        titleIsNull: createData.title === null,
                        titleType: typeof createData.title
                    });
                }
                // Check if we have multi-locale data and extract it
                const { flatData, hasMultiLocale, localeUpdates } = extractMultiLocaleData(createData, configuredLocales);
                if (hasMultiLocale) {
                    // Create with default locale data
                    processedDoc = await req.payload.create({
                        collection: collectionSlug,
                        data: flatData,
                        draft: draftOption,
                        overrideAccess: false,
                        req,
                        user
                    });
                    // Update for other locales
                    if (processedDoc && Object.keys(localeUpdates).length > 0) {
                        for (const [locale, localeData] of Object.entries(localeUpdates)){
                            try {
                                const localeReq = {
                                    ...req,
                                    locale
                                };
                                await req.payload.update({
                                    id: processedDoc.id,
                                    collection: collectionSlug,
                                    data: localeData,
                                    draft: collectionHasVersions ? false : undefined,
                                    overrideAccess: false,
                                    req: localeReq,
                                    user
                                });
                            } catch (error) {
                                // Log but don't fail the entire import if a locale update fails
                                req.payload.logger.error({
                                    err: error,
                                    msg: `Failed to update locale ${locale} for document ${String(processedDoc.id)}`
                                });
                            }
                        }
                    }
                } else {
                    // No multi-locale data, create normally
                    processedDoc = await req.payload.create({
                        collection: collectionSlug,
                        data: createData,
                        draft: draftOption,
                        overrideAccess: false,
                        req,
                        user
                    });
                }
            } else if (importMode === 'update' || importMode === 'upsert') {
                const matchValue = document[matchField || 'id'];
                if (!matchValue) {
                    throw new Error(`Match field "${matchField || 'id'}" not found in document`);
                }
                // Special handling for ID field with MongoDB
                // If matching by 'id' and it's not a valid ObjectID format, handle specially
                const isMatchingById = (matchField || 'id') === 'id';
                // Check if it's a valid MongoDB ObjectID format (24 hex chars)
                // Note: matchValue could be string, number, or ObjectID object
                let matchValueStr;
                if (typeof matchValue === 'object' && matchValue !== null) {
                    matchValueStr = JSON.stringify(matchValue);
                } else if (typeof matchValue === 'string') {
                    matchValueStr = matchValue;
                } else if (typeof matchValue === 'number') {
                    matchValueStr = matchValue.toString();
                } else {
                    // For other types, use JSON.stringify
                    matchValueStr = JSON.stringify(matchValue);
                }
                const isValidObjectIdFormat = /^[0-9a-f]{24}$/i.test(matchValueStr);
                // Try to search normally first, catch errors for invalid IDs
                try {
                    existing = await req.payload.find({
                        collection: collectionSlug,
                        depth: 0,
                        limit: 1,
                        overrideAccess: false,
                        req,
                        user,
                        where: {
                            [matchField || 'id']: {
                                equals: matchValue
                            }
                        }
                    });
                } catch (error) {
                    // If we get an error when searching by ID (e.g., invalid ObjectID format)
                    // and we're in upsert mode, treat as non-existent
                    if (isMatchingById && importMode === 'upsert' && !isValidObjectIdFormat) {
                        existing = {
                            docs: []
                        };
                    } else if (isMatchingById && importMode === 'update' && !isValidObjectIdFormat) {
                        // For update mode with invalid ID, this should fail
                        throw new Error(`Invalid ID format for update: ${matchValueStr}`);
                    } else {
                        // Re-throw other errors
                        throw error;
                    }
                }
                if (existing.docs.length > 0) {
                    // Update existing
                    const existingDoc = existing.docs[0];
                    if (!existingDoc) {
                        throw new Error(`Document not found`);
                    }
                    // Debug: log what we found
                    if (req.payload.config.debug) {
                        req.payload.logger.info({
                            existingId: existingDoc.id,
                            existingStatus: existingDoc._status,
                            existingTitle: existingDoc.title,
                            incomingDocument: document,
                            mode: importMode,
                            msg: 'Found existing document for update'
                        });
                    }
                    const updateData = {
                        ...document
                    };
                    // Remove ID and internal fields from update data
                    delete updateData.id;
                    delete updateData._id;
                    delete updateData.createdAt;
                    delete updateData.updatedAt;
                    // Check if we have multi-locale data and extract it
                    const { flatData, hasMultiLocale, localeUpdates } = extractMultiLocaleData(updateData, configuredLocales);
                    if (req.payload.config.debug) {
                        req.payload.logger.info({
                            existingId: existingDoc.id,
                            hasMultiLocale,
                            mode: importMode,
                            msg: 'Updating document in upsert/update mode',
                            updateData: Object.keys(hasMultiLocale ? flatData : updateData).reduce((acc, key)=>{
                                const val = (hasMultiLocale ? flatData : updateData)[key];
                                acc[key] = typeof val === 'string' && val.length > 50 ? val.substring(0, 50) + '...' : val;
                                return acc;
                            }, {})
                        });
                    }
                    if (hasMultiLocale) {
                        // Update with default locale data
                        processedDoc = await req.payload.update({
                            id: existingDoc.id,
                            collection: collectionSlug,
                            data: flatData,
                            depth: 0,
                            // Don't specify draft - this creates a new draft for versioned collections
                            overrideAccess: false,
                            req,
                            user
                        });
                        // Update for other locales
                        if (processedDoc && Object.keys(localeUpdates).length > 0) {
                            for (const [locale, localeData] of Object.entries(localeUpdates)){
                                try {
                                    // Clone the request with the specific locale
                                    const localeReq = {
                                        ...req,
                                        locale
                                    };
                                    await req.payload.update({
                                        id: existingDoc.id,
                                        collection: collectionSlug,
                                        data: localeData,
                                        depth: 0,
                                        // Don't specify draft - this creates a new draft for versioned collections
                                        overrideAccess: false,
                                        req: localeReq,
                                        user
                                    });
                                } catch (error) {
                                    // Log but don't fail the entire import if a locale update fails
                                    req.payload.logger.error({
                                        err: error,
                                        msg: `Failed to update locale ${locale} for document ${String(existingDoc.id)}`
                                    });
                                }
                            }
                        }
                    } else {
                        // No multi-locale data, update normally
                        try {
                            // Extra debug: log before update
                            if (req.payload.config.debug) {
                                req.payload.logger.info({
                                    existingId: existingDoc.id,
                                    existingTitle: existingDoc.title,
                                    msg: 'About to update document',
                                    newData: updateData
                                });
                            }
                            // Update the document - don't specify draft to let Payload handle versions properly
                            // This will create a new draft version for collections with versions enabled
                            processedDoc = await req.payload.update({
                                id: existingDoc.id,
                                collection: collectionSlug,
                                data: updateData,
                                depth: 0,
                                // Don't specify draft - this creates a new draft for versioned collections
                                overrideAccess: false,
                                req,
                                user
                            });
                            // Debug: log what was returned
                            if (req.payload.config.debug && processedDoc) {
                                req.payload.logger.info({
                                    id: processedDoc.id,
                                    msg: 'Update completed',
                                    status: processedDoc._status,
                                    title: processedDoc.title
                                });
                            }
                        } catch (updateError) {
                            req.payload.logger.error({
                                id: existingDoc.id,
                                err: updateError,
                                msg: 'Update failed'
                            });
                            throw updateError;
                        }
                    }
                } else if (importMode === 'upsert') {
                    // Create new in upsert mode
                    if (req.payload.config.debug) {
                        req.payload.logger.info({
                            document,
                            matchField: matchField || 'id',
                            matchValue: document[matchField || 'id'],
                            msg: 'No existing document found, creating new in upsert mode'
                        });
                    }
                    const createData = {
                        ...document
                    };
                    delete createData.id;
                    // Only handle _status for versioned collections
                    let draftOption;
                    if (collectionHasVersions) {
                        // Use defaultVersionStatus from config if _status not provided
                        const statusValue = createData._status || options.defaultVersionStatus;
                        const isPublished = statusValue !== 'draft';
                        draftOption = !isPublished;
                        delete createData._status; // Remove _status from data - it's controlled via draft option
                    }
                    // Check if we have multi-locale data and extract it
                    const { flatData, hasMultiLocale, localeUpdates } = extractMultiLocaleData(createData, configuredLocales);
                    if (hasMultiLocale) {
                        // Create with default locale data
                        processedDoc = await req.payload.create({
                            collection: collectionSlug,
                            data: flatData,
                            draft: draftOption,
                            overrideAccess: false,
                            req,
                            user
                        });
                        // Update for other locales
                        if (processedDoc && Object.keys(localeUpdates).length > 0) {
                            for (const [locale, localeData] of Object.entries(localeUpdates)){
                                try {
                                    // Clone the request with the specific locale
                                    const localeReq = {
                                        ...req,
                                        locale
                                    };
                                    await req.payload.update({
                                        id: processedDoc.id,
                                        collection: collectionSlug,
                                        data: localeData,
                                        draft: collectionHasVersions ? false : undefined,
                                        overrideAccess: false,
                                        req: localeReq
                                    });
                                } catch (error) {
                                    // Log but don't fail the entire import if a locale update fails
                                    req.payload.logger.error({
                                        err: error,
                                        msg: `Failed to update locale ${locale} for document ${String(processedDoc.id)}`
                                    });
                                }
                            }
                        }
                    } else {
                        // No multi-locale data, create normally
                        processedDoc = await req.payload.create({
                            collection: collectionSlug,
                            data: createData,
                            draft: draftOption,
                            overrideAccess: false,
                            req,
                            user
                        });
                    }
                } else {
                    // Update mode but document not found
                    let matchValueDisplay;
                    if (typeof matchValue === 'object' && matchValue !== null) {
                        matchValueDisplay = JSON.stringify(matchValue);
                    } else if (typeof matchValue === 'string') {
                        matchValueDisplay = matchValue;
                    } else if (typeof matchValue === 'number') {
                        matchValueDisplay = matchValue.toString();
                    } else {
                        // For other types, use JSON.stringify to avoid [object Object]
                        matchValueDisplay = JSON.stringify(matchValue);
                    }
                    throw new Error(`Document with ${matchField || 'id'}="${matchValueDisplay}" not found`);
                }
            } else {
                throw new Error(`Unknown import mode: ${String(importMode)}`);
            }
            if (processedDoc) {
                // Determine operation type for proper counting
                let operation;
                if (importMode === 'create') {
                    operation = 'created';
                } else if (importMode === 'update') {
                    operation = 'updated';
                } else if (importMode === 'upsert') {
                    // In upsert mode, check if we found an existing document
                    if (existing && existing.docs.length > 0) {
                        operation = 'updated';
                    } else {
                        operation = 'created';
                    }
                }
                result.successful.push({
                    document,
                    index: rowNumber - 1,
                    operation,
                    result: processedDoc
                });
            }
        } catch (error) {
            const importError = {
                type: categorizeError(error),
                documentData: document || {},
                error: extractErrorMessage(error),
                item: document || {},
                itemIndex: rowNumber - 1,
                rowNumber
            };
            // Try to extract field information from validation errors
            if (error && typeof error === 'object' && 'data' in error) {
                const errorData = error;
                if (errorData.data?.errors && Array.isArray(errorData.data.errors)) {
                    const firstError = errorData.data.errors[0];
                    if (firstError?.path) {
                        importError.field = firstError.path;
                    }
                }
            }
            result.failed.push(importError);
        // Always continue processing all rows
        }
    }
    return result;
}
export function createImportBatchProcessor(options = {}) {
    const processorOptions = {
        batchSize: options.batchSize ?? 100,
        defaultVersionStatus: options.defaultVersionStatus ?? 'published'
    };
    const processImport = async (processOptions)=>{
        const { collectionSlug, documents, importMode, matchField, req, user } = processOptions;
        const batches = createBatches(documents, processorOptions.batchSize);
        const result = {
            errors: [],
            imported: 0,
            total: documents.length,
            updated: 0
        };
        for(let i = 0; i < batches.length; i++){
            const currentBatch = batches[i];
            if (!currentBatch) {
                continue;
            }
            const batchResult = await processImportBatch({
                batch: currentBatch,
                batchIndex: i,
                collectionSlug,
                importMode,
                matchField,
                options: processorOptions,
                req,
                user
            });
            // Update results
            for (const success of batchResult.successful){
                if (success.operation === 'created') {
                    result.imported++;
                } else if (success.operation === 'updated') {
                    result.updated++;
                } else {
                    // Fallback
                    if (importMode === 'create') {
                        result.imported++;
                    } else {
                        result.updated++;
                    }
                }
            }
            for (const error of batchResult.failed){
                result.errors.push({
                    doc: error.documentData,
                    error: error.error,
                    index: error.rowNumber - 1
                });
            }
        }
        return result;
    };
    return {
        processImport
    };
}

//# sourceMappingURL=batchProcessor.js.map