import { combineQueries } from '../database/combineQueries.js';
import { hasDraftsEnabled } from '../utilities/getVersionsConfig.js';
import { appendVersionToQueryKey } from './drafts/appendVersionToQueryKey.js';
export const getLatestCollectionVersion = async ({ id, config, payload, published, query, req })=>{
    let latestVersion;
    const whereQuery = published ? {
        and: [
            {
                parent: {
                    equals: id
                }
            },
            {
                'version._status': {
                    equals: 'published'
                }
            }
        ]
    } : {
        and: [
            {
                parent: {
                    equals: id
                }
            },
            {
                latest: {
                    equals: true
                }
            }
        ]
    };
    if (hasDraftsEnabled(config)) {
        const { docs } = await payload.db.findVersions({
            collection: config.slug,
            limit: 1,
            locale: req?.locale || query.locale,
            pagination: false,
            req,
            sort: '-updatedAt',
            where: combineQueries(appendVersionToQueryKey(query.where), whereQuery)
        });
        latestVersion = docs[0];
    }
    if (!latestVersion) {
        if (!published) {
            const doc = await payload.db.findOne({
                ...query,
                req
            });
            return doc ?? undefined;
        }
        return undefined;
    }
    latestVersion.version.id = id;
    return latestVersion.version;
};

//# sourceMappingURL=getLatestCollectionVersion.js.map