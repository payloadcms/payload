import { getIncomingFiles } from '../utilities/getIncomingFiles.js';
export const getAfterChangeHook = ({ adapter, collection })=>async ({ doc, operation, previousDoc, req })=>{
        try {
            const files = getIncomingFiles({
                data: doc,
                req
            });
            if (files.length > 0) {
                // If there is a previous doc, files and the operation is update,
                // delete the old files before uploading the new ones.
                if (previousDoc && operation === 'update') {
                    let filesToDelete = [];
                    if (typeof previousDoc?.filename === 'string') {
                        filesToDelete.push(previousDoc.filename);
                    }
                    if (typeof previousDoc.sizes === 'object') {
                        filesToDelete = filesToDelete.concat(Object.values(previousDoc?.sizes || []).map((resizedFileData)=>resizedFileData?.filename));
                    }
                    const deletionPromises = filesToDelete.map(async (filename)=>{
                        if (filename) {
                            await adapter.handleDelete({
                                collection,
                                doc: previousDoc,
                                filename,
                                req
                            });
                        }
                    });
                    await Promise.all(deletionPromises);
                }
                const uploadResults = await Promise.all(files.map((file)=>adapter.handleUpload({
                        clientUploadContext: file.clientUploadContext,
                        collection,
                        data: doc,
                        file,
                        req
                    })));
                const uploadMetadata = uploadResults.filter((result)=>result != null && typeof result === 'object').reduce((acc, metadata)=>({
                        ...acc,
                        ...metadata
                    }), {});
                if (Object.keys(uploadMetadata).length > 0) {
                    try {
                        await req.payload.update({
                            id: doc.id,
                            collection: collection.slug,
                            data: uploadMetadata,
                            depth: 0,
                            req
                        });
                        return {
                            ...doc,
                            ...uploadMetadata
                        };
                    } catch (updateError) {
                        req.payload.logger.warn(`Failed to persist upload data for collection ${collection.slug} document ${doc.id}: ${String(updateError)}`);
                    }
                }
            }
        } catch (err) {
            req.payload.logger.error(`There was an error while uploading files corresponding to the collection ${collection.slug} with filename ${doc.filename}:`);
            req.payload.logger.error({
                err
            });
            throw err;
        }
        return doc;
    };

//# sourceMappingURL=afterChange.js.map