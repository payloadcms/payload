import { GraphQLObjectType } from 'graphql';
import { fieldToSchemaMap } from './fieldToSchemaMap.js';
export function buildObjectType({ name, baseFields = {}, collectionSlug, config, fields, forceNullable, graphqlResult, parentIsLocalized, parentName }) {
    const objectSchema = {
        name,
        fields: ()=>fields.reduce((objectTypeConfig, field)=>{
                const fieldSchema = fieldToSchemaMap[field.type];
                if (typeof fieldSchema !== 'function') {
                    return objectTypeConfig;
                }
                return {
                    ...objectTypeConfig,
                    ...fieldSchema({
                        collectionSlug,
                        config,
                        field,
                        forceNullable,
                        graphqlResult,
                        newlyCreatedBlockType,
                        objectTypeConfig,
                        parentIsLocalized,
                        parentName
                    })
                };
            }, baseFields)
    };
    const newlyCreatedBlockType = new GraphQLObjectType(objectSchema);
    return newlyCreatedBlockType;
}

//# sourceMappingURL=buildObjectType.js.map