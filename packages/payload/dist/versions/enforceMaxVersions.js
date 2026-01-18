export const enforceMaxVersions = async ({ id, collection, global: globalConfig, max, payload, req })=>{
    const entityType = collection ? 'collection' : 'global';
    const slug = collection ? collection.slug : globalConfig?.slug;
    try {
        const where = {};
        let oldestAllowedDoc;
        if (collection) {
            where.parent = {
                equals: id
            };
            const query = await payload.db.findVersions({
                collection: collection.slug,
                limit: 1,
                page: max + 1,
                pagination: false,
                req,
                sort: '-updatedAt',
                where
            });
            [oldestAllowedDoc] = query.docs;
        } else if (globalConfig) {
            const query = await payload.db.findGlobalVersions({
                global: globalConfig.slug,
                limit: 1,
                page: max + 1,
                pagination: false,
                req,
                sort: '-updatedAt',
                where
            });
            [oldestAllowedDoc] = query.docs;
        }
        if (oldestAllowedDoc?.updatedAt) {
            const deleteQuery = {
                updatedAt: {
                    less_than_equal: oldestAllowedDoc.updatedAt
                }
            };
            if (collection) {
                deleteQuery.parent = {
                    equals: id
                };
            }
            const deleteVersionsArgs = {
                req,
                where: deleteQuery
            };
            if (globalConfig) {
                deleteVersionsArgs.globalSlug = slug;
            } else {
                deleteVersionsArgs.collection = slug;
            }
            await payload.db.deleteVersions(deleteVersionsArgs);
        }
    } catch (err) {
        payload.logger.error(err);
        payload.logger.error(`There was an error cleaning up old versions for the ${entityType} ${slug}`);
    }
};

//# sourceMappingURL=enforceMaxVersions.js.map