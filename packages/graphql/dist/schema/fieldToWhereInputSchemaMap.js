import { GraphQLEnumType, GraphQLInputObjectType } from 'graphql';
import { GraphQLJSON } from '../packages/graphql-type-json/index.js';
import { combineParentName } from '../utilities/combineParentName.js';
import { formatName } from '../utilities/formatName.js';
import { recursivelyBuildNestedPaths } from './recursivelyBuildNestedPaths.js';
import { withOperators } from './withOperators.js';
export const fieldToSchemaMap = ({ nestedFieldName, parentName })=>({
        array: (field)=>recursivelyBuildNestedPaths({
                field,
                nestedFieldName2: nestedFieldName,
                parentName
            }),
        checkbox: (field)=>({
                type: withOperators(field, parentName)
            }),
        code: (field)=>({
                type: withOperators(field, parentName)
            }),
        collapsible: (field)=>recursivelyBuildNestedPaths({
                field,
                nestedFieldName2: nestedFieldName,
                parentName
            }),
        date: (field)=>({
                type: withOperators(field, parentName)
            }),
        email: (field)=>({
                type: withOperators(field, parentName)
            }),
        group: (field)=>recursivelyBuildNestedPaths({
                field,
                nestedFieldName2: nestedFieldName,
                parentName
            }),
        json: (field)=>({
                type: withOperators(field, parentName)
            }),
        number: (field)=>({
                type: withOperators(field, parentName)
            }),
        point: (field)=>({
                type: withOperators(field, parentName)
            }),
        radio: (field)=>({
                type: withOperators(field, parentName)
            }),
        relationship: (field)=>{
            if (Array.isArray(field.relationTo)) {
                return {
                    type: new GraphQLInputObjectType({
                        name: `${combineParentName(parentName, field.name)}_Relation`,
                        fields: {
                            relationTo: {
                                type: new GraphQLEnumType({
                                    name: `${combineParentName(parentName, field.name)}_Relation_RelationTo`,
                                    values: field.relationTo.reduce((values, relation)=>({
                                            ...values,
                                            [formatName(relation)]: {
                                                value: relation
                                            }
                                        }), {})
                                })
                            },
                            value: {
                                type: GraphQLJSON
                            }
                        }
                    })
                };
            }
            return {
                type: withOperators(field, parentName)
            };
        },
        richText: (field)=>({
                type: withOperators(field, parentName)
            }),
        row: (field)=>recursivelyBuildNestedPaths({
                field,
                nestedFieldName2: nestedFieldName,
                parentName
            }),
        select: (field)=>({
                type: withOperators(field, parentName)
            }),
        tabs: (field)=>recursivelyBuildNestedPaths({
                field,
                nestedFieldName2: nestedFieldName,
                parentName
            }),
        text: (field)=>({
                type: withOperators(field, parentName)
            }),
        textarea: (field)=>({
                type: withOperators(field, parentName)
            }),
        upload: (field)=>{
            if (Array.isArray(field.relationTo)) {
                return {
                    type: new GraphQLInputObjectType({
                        name: `${combineParentName(parentName, field.name)}_Relation`,
                        fields: {
                            relationTo: {
                                type: new GraphQLEnumType({
                                    name: `${combineParentName(parentName, field.name)}_Relation_RelationTo`,
                                    values: field.relationTo.reduce((values, relation)=>({
                                            ...values,
                                            [formatName(relation)]: {
                                                value: relation
                                            }
                                        }), {})
                                })
                            },
                            value: {
                                type: GraphQLJSON
                            }
                        }
                    })
                };
            }
            return {
                type: withOperators(field, parentName)
            };
        }
    });

//# sourceMappingURL=fieldToWhereInputSchemaMap.js.map