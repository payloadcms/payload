import fs from 'fs';
import path from 'path';
import { createImport } from './createImport.js';
import { getFields } from './getFields.js';
import { handlePreview } from './handlePreview.js';
export const getImportCollection = ({ config, importConfig, pluginConfig })=>{
    const beforeOperation = [];
    const afterChange = [];
    // Extract import-specific settings
    const disableJobsQueue = importConfig?.disableJobsQueue ?? false;
    const batchSize = importConfig?.batchSize ?? 100;
    const defaultVersionStatus = importConfig?.defaultVersionStatus ?? 'published';
    // Get collection slugs for the dropdown
    const collectionSlugs = pluginConfig.collections?.map((c)=>c.slug);
    const collection = {
        slug: 'imports',
        access: {
            update: ()=>false
        },
        admin: {
            components: {
                edit: {
                    SaveButton: '@payloadcms/plugin-import-export/rsc#ImportSaveButton'
                }
            },
            disableCopyToLocale: true,
            group: false,
            useAsTitle: 'filename'
        },
        disableDuplicate: true,
        endpoints: [
            {
                handler: handlePreview,
                method: 'post',
                path: '/preview-data'
            }
        ],
        fields: getFields(config, {
            collectionSlugs
        }),
        hooks: {
            afterChange,
            beforeOperation
        },
        lockDocuments: false,
        upload: {
            filesRequiredOnCreate: true,
            hideFileInputOnCreate: false,
            hideRemoveFile: true,
            mimeTypes: [
                'text/csv',
                'application/json'
            ]
        }
    };
    if (disableJobsQueue) {
        // Process the import synchronously after the document (with file) has been created
        afterChange.push(async ({ collection: collectionConfig, doc, operation, req })=>{
            if (operation !== 'create' || doc.status !== 'pending') {
                return doc;
            }
            const debug = pluginConfig.debug || false;
            try {
                // Get file data from the uploaded document
                let fileData;
                let fileMimetype;
                if (doc.url && doc.url.startsWith('http')) {
                    // File has been uploaded to external storage (S3, etc.) - fetch it
                    const response = await fetch(doc.url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch file from URL: ${doc.url}`);
                    }
                    fileData = Buffer.from(await response.arrayBuffer());
                    fileMimetype = doc.mimeType || 'text/csv';
                } else {
                    // File is stored locally - read from filesystem
                    const filePath = doc.filename;
                    // Get upload config from the actual sanitized collection config
                    const uploadConfig = typeof collectionConfig?.upload === 'object' ? collectionConfig.upload : undefined;
                    const uploadDir = uploadConfig?.staticDir || './uploads';
                    const fullPath = path.resolve(uploadDir, filePath);
                    fileData = await fs.promises.readFile(fullPath);
                    fileMimetype = doc.mimeType || 'text/csv';
                }
                const result = await createImport({
                    id: doc.id,
                    name: doc.filename || 'import',
                    batchSize,
                    collectionSlug: doc.collectionSlug,
                    debug,
                    defaultVersionStatus,
                    file: {
                        name: doc.filename,
                        data: fileData,
                        mimetype: fileMimetype
                    },
                    format: fileMimetype === 'text/csv' ? 'csv' : 'json',
                    importMode: doc.importMode || 'create',
                    matchField: doc.matchField,
                    req,
                    userCollection: req?.user?.collection || req?.user?.user?.collection,
                    userID: req?.user?.id || req?.user?.user?.id
                });
                // Determine status
                let status;
                if (result.errors.length === 0) {
                    status = 'completed';
                } else if (result.imported + result.updated === 0) {
                    status = 'failed';
                } else {
                    status = 'partial';
                }
                const summary = {
                    imported: result.imported,
                    issueDetails: result.errors.length > 0 ? result.errors.map((e)=>({
                            data: e.doc,
                            error: e.error,
                            row: e.index + 1
                        })) : undefined,
                    issues: result.errors.length,
                    total: result.total,
                    updated: result.updated
                };
                // Try to update the document with results (may fail due to transaction timing)
                try {
                    await req.payload.update({
                        id: doc.id,
                        collection: collectionConfig.slug,
                        data: {
                            status,
                            summary
                        },
                        overrideAccess: true,
                        req
                    });
                } catch (updateErr) {
                    // Update may fail if document not yet committed, log but continue
                    if (debug) {
                        req.payload.logger.error({
                            err: updateErr,
                            msg: `Failed to update import document ${doc.id} with results`
                        });
                    }
                }
                // Return updated doc for immediate response
                return {
                    ...doc,
                    status,
                    summary
                };
            } catch (err) {
                const summary = {
                    imported: 0,
                    issueDetails: [
                        {
                            data: {},
                            error: err instanceof Error ? err.message : String(err),
                            row: 0
                        }
                    ],
                    issues: 1,
                    total: 0,
                    updated: 0
                };
                // Try to update document with error status
                try {
                    await req.payload.update({
                        id: doc.id,
                        collection: collectionConfig.slug,
                        data: {
                            status: 'failed',
                            summary
                        },
                        overrideAccess: true,
                        req
                    });
                } catch (updateErr) {
                    // Update may fail if document not yet committed, log but continue
                    if (debug) {
                        req.payload.logger.error({
                            err: updateErr,
                            msg: `Failed to update import document ${doc.id} with error status`
                        });
                    }
                }
                if (debug) {
                    req.payload.logger.error({
                        err,
                        msg: 'Import processing failed'
                    });
                }
                // Return error status for immediate response
                return {
                    ...doc,
                    status: 'failed',
                    summary
                };
            }
        });
    } else {
        // When jobs queue is enabled, queue the import as a job
        afterChange.push(async ({ collection: collectionConfig, doc, operation, req })=>{
            if (operation !== 'create') {
                return;
            }
            try {
                // Get file data for job - need to read from disk/URL since req.file is not available in afterChange
                let fileData;
                if (doc.url && doc.url.startsWith('http')) {
                    const response = await fetch(doc.url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch file from URL: ${doc.url}`);
                    }
                    fileData = Buffer.from(await response.arrayBuffer());
                } else {
                    const filePath = doc.filename;
                    // Get upload config from the actual sanitized collection config
                    const uploadConfig = typeof collectionConfig?.upload === 'object' ? collectionConfig.upload : undefined;
                    const uploadDir = uploadConfig?.staticDir || './uploads';
                    const fullPath = path.resolve(uploadDir, filePath);
                    fileData = await fs.promises.readFile(fullPath);
                }
                const input = {
                    name: doc.filename,
                    batchSize,
                    collectionSlug: doc.collectionSlug,
                    debug: pluginConfig.debug,
                    defaultVersionStatus,
                    file: {
                        name: doc.filename,
                        // Convert to base64 for job serialization - will be converted back to Buffer in task handler
                        data: fileData.toString('base64'),
                        mimetype: doc.mimeType || 'text/csv'
                    },
                    format: doc.mimeType === 'text/csv' ? 'csv' : 'json',
                    importId: doc.id,
                    importMode: doc.importMode || 'create',
                    importsCollection: collectionConfig.slug,
                    matchField: doc.matchField,
                    userCollection: req.user?.collection || req?.user?.user?.collection,
                    userID: req?.user?.id || req?.user?.user?.id
                };
                await req.payload.jobs.queue({
                    input,
                    task: 'createCollectionImport'
                });
            } catch (err) {
                req.payload.logger.error({
                    err,
                    msg: `Failed to queue import job for document ${doc.id}`
                });
            }
        });
    }
    return collection;
};

//# sourceMappingURL=getImportCollection.js.map