import paginate from 'mongoose-paginate-v2';
import { getBuildQueryPlugin } from '../queries/getBuildQueryPlugin.js';
import { buildSchema } from './buildSchema.js';
export const buildCollectionSchema = (collection, payload, schemaOptions = {})=>{
    const schema = buildSchema({
        buildSchemaOptions: {
            draftsEnabled: Boolean(typeof collection?.versions === 'object' && collection.versions.drafts),
            indexSortableFields: payload.config.indexSortableFields,
            options: {
                minimize: false,
                timestamps: collection.timestamps !== false,
                ...schemaOptions
            }
        },
        compoundIndexes: collection.sanitizedIndexes,
        configFields: collection.fields,
        flattenedFields: collection.flattenedFields,
        payload
    });
    if (Array.isArray(collection.upload.filenameCompoundIndex)) {
        const indexDefinition = collection.upload.filenameCompoundIndex.reduce((acc, index)=>{
            acc[index] = 1;
            return acc;
        }, {});
        schema.index(indexDefinition, {
            unique: true
        });
    }
    schema.plugin(paginate, {
        useEstimatedCount: true
    }).plugin(getBuildQueryPlugin({
        collectionSlug: collection.slug
    }));
    return schema;
};

//# sourceMappingURL=buildCollectionSchema.js.map