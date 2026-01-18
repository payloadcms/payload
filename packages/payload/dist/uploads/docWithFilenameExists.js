export const docWithFilenameExists = async ({ collectionSlug, filename, prefix, req })=>{
    const where = {
        filename: {
            equals: filename
        }
    };
    if (prefix) {
        where.prefix = {
            equals: prefix
        };
    }
    const doc = await req.payload.db.findOne({
        collection: collectionSlug,
        req,
        where
    });
    return !!doc;
};

//# sourceMappingURL=docWithFilenameExists.js.map