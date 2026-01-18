import type { GraphQLFieldConfig } from 'graphql';
import type { Field, GraphQLInfo, SanitizedConfig } from 'payload';
import { GraphQLObjectType } from 'graphql';
export type ObjectTypeConfig = {
    [path: string]: GraphQLFieldConfig<any, any, any>;
};
type Args = {
    baseFields?: ObjectTypeConfig;
    collectionSlug?: string;
    config: SanitizedConfig;
    fields: Field[];
    forceNullable?: boolean;
    graphqlResult: GraphQLInfo;
    name: string;
    parentIsLocalized?: boolean;
    parentName: string;
};
export declare function buildObjectType({ name, baseFields, collectionSlug, config, fields, forceNullable, graphqlResult, parentIsLocalized, parentName, }: Args): GraphQLObjectType;
export {};
//# sourceMappingURL=buildObjectType.d.ts.map