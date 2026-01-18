export const deleteCollectionVersions = async ({ id, slug, payload, req })=>{
    try {
        await payload.db.deleteVersions({
            collection: slug,
            req,
            where: {
                parent: {
                    equals: id
                }
            }
        });
    } catch (err) {
        payload.logger.error({
            err,
            msg: `There was an error removing versions for the deleted ${slug} document with ID ${id}.`
        });
    }
};

//# sourceMappingURL=deleteCollectionVersions.js.map