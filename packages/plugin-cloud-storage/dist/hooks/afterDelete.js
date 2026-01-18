export const getAfterDeleteHook = ({ adapter, collection })=>{
    return async ({ doc, req })=>{
        try {
            const filesToDelete = [
                doc.filename,
                ...Object.values(doc?.sizes || []).map((resizedFileData)=>resizedFileData?.filename)
            ];
            const promises = filesToDelete.map(async (filename)=>{
                if (filename) {
                    await adapter.handleDelete({
                        collection,
                        doc,
                        filename,
                        req
                    });
                }
            });
            await Promise.all(promises);
        } catch (err) {
            req.payload.logger.error({
                err,
                msg: `There was an error while deleting files corresponding to the ${collection.labels?.singular} with ID ${doc.id}.`
            });
        }
        return doc;
    };
};

//# sourceMappingURL=afterDelete.js.map