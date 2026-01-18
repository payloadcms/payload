import type { GraphQLInputFieldConfig, GraphQLScalarType } from 'graphql';
import type { Field, GraphQLInfo, SanitizedCollectionConfig, SanitizedConfig } from 'payload';
import { GraphQLInputObjectType } from 'graphql';
declare const idFieldTypes: {
    number: GraphQLScalarType<number, number>;
    text: GraphQLScalarType<string, string>;
};
export declare const getCollectionIDType: (type: keyof typeof idFieldTypes, collection: SanitizedCollectionConfig) => GraphQLScalarType;
export type InputObjectTypeConfig = {
    [path: string]: GraphQLInputFieldConfig;
};
type BuildMutationInputTypeArgs = {
    config: SanitizedConfig;
    fields: Field[];
    forceNullable?: boolean;
    graphqlResult: GraphQLInfo;
    name: string;
    parentIsLocalized: boolean;
    parentName: string;
};
export declare function buildMutationInputType({ name, config, fields, forceNullable, graphqlResult, parentIsLocalized, parentName, }: BuildMutationInputTypeArgs): GraphQLInputObjectType | null;
export {};
//# sourceMappingURL=buildMutationInputType.d.ts.map