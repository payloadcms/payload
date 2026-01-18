import { preferencesCollectionSlug } from './config.js';
export const deleteUserPreferences = async ({ collectionConfig, ids, payload, req })=>{
    if (collectionConfig.auth) {
        await payload.db.deleteMany({
            collection: preferencesCollectionSlug,
            req,
            where: {
                or: [
                    {
                        and: [
                            {
                                'user.value': {
                                    in: ids
                                }
                            },
                            {
                                'user.relationTo': {
                                    equals: collectionConfig.slug
                                }
                            }
                        ]
                    },
                    {
                        key: {
                            in: ids.map((id)=>`collection-${collectionConfig.slug}-${id}`)
                        }
                    }
                ]
            }
        });
    } else {
        await payload.db.deleteMany({
            collection: preferencesCollectionSlug,
            req,
            where: {
                key: {
                    in: ids.map((id)=>`collection-${collectionConfig.slug}-${id}`)
                }
            }
        });
    }
};

//# sourceMappingURL=deleteUserPreferences.js.map