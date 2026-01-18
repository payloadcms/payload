import { APIError } from 'payload';
import { parseParams } from './parseParams.js';
// This plugin asynchronously builds a list of Mongoose query constraints
// which can then be used in subsequent Mongoose queries.
// Deprecated in favor of using simpler buildQuery directly
export const getBuildQueryPlugin = ({ collectionSlug, versionsFields } = {})=>{
    return function buildQueryPlugin(schema) {
        const modifiedSchema = schema;
        async function schemaBuildQuery({ globalSlug, locale, payload, where }) {
            let fields = null;
            if (versionsFields) {
                fields = versionsFields;
            } else {
                if (globalSlug) {
                    const globalConfig = payload.globals.config.find(({ slug })=>slug === globalSlug);
                    if (!globalConfig) {
                        throw new APIError(`Global with the slug ${globalSlug} was not found`);
                    }
                    fields = globalConfig.flattenedFields;
                }
                if (collectionSlug) {
                    const collectionConfig = payload.collections[collectionSlug]?.config;
                    if (!collectionConfig) {
                        throw new APIError(`Collection with the slug ${globalSlug} was not found`);
                    }
                    fields = collectionConfig.flattenedFields;
                }
            }
            if (fields === null) {
                throw new APIError('Fields are not initialized.');
            }
            const result = await parseParams({
                collectionSlug,
                fields,
                globalSlug,
                locale,
                parentIsLocalized: false,
                payload,
                where
            });
            return result;
        }
        modifiedSchema.statics.buildQuery = schemaBuildQuery;
    };
};

//# sourceMappingURL=getBuildQueryPlugin.js.map