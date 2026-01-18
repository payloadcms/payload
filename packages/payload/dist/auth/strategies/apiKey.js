import crypto from 'crypto';
export const APIKeyAuthentication = (collectionConfig)=>async ({ headers, isGraphQL = false, payload })=>{
        const authHeader = headers.get('Authorization');
        if (authHeader?.startsWith(`${collectionConfig.slug} API-Key `)) {
            const apiKey = authHeader.replace(`${collectionConfig.slug} API-Key `, '');
            // TODO: V4 remove extra algorithm check
            // api keys saved prior to v3.46.0 will have sha1
            const sha1APIKeyIndex = crypto.createHmac('sha1', payload.secret).update(apiKey).digest('hex');
            const sha256APIKeyIndex = crypto.createHmac('sha256', payload.secret).update(apiKey).digest('hex');
            const apiKeyConstraints = [
                {
                    apiKeyIndex: {
                        equals: sha1APIKeyIndex
                    }
                },
                {
                    apiKeyIndex: {
                        equals: sha256APIKeyIndex
                    }
                }
            ];
            try {
                const where = {};
                if (collectionConfig.auth?.verify) {
                    where.and = [
                        {
                            or: apiKeyConstraints
                        },
                        {
                            _verified: {
                                not_equals: false
                            }
                        }
                    ];
                } else {
                    where.or = apiKeyConstraints;
                }
                const userQuery = await payload.find({
                    collection: collectionConfig.slug,
                    depth: isGraphQL ? 0 : collectionConfig.auth.depth,
                    limit: 1,
                    overrideAccess: true,
                    pagination: false,
                    where
                });
                if (userQuery.docs && userQuery.docs.length > 0) {
                    const user = userQuery.docs[0];
                    user.collection = collectionConfig.slug;
                    user._strategy = 'api-key';
                    return {
                        user: user
                    };
                }
            } catch (ignore) {
                return {
                    user: null
                };
            }
        }
        return {
            user: null
        };
    };

//# sourceMappingURL=apiKey.js.map