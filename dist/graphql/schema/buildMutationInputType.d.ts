import { GraphQLInputFieldConfig, GraphQLInputObjectType, GraphQLScalarType } from 'graphql';
import { Field } from '../../fields/config/types';
import { Payload } from '../../payload';
import { SanitizedCollectionConfig } from '../../collections/config/types';
export declare const getCollectionIDType: (config: SanitizedCollectionConfig) => GraphQLScalarType;
export type InputObjectTypeConfig = {
    [path: string]: GraphQLInputFieldConfig;
};
declare function buildMutationInputType(payload: Payload, name: string, fields: Field[], parentName: string, forceNullable?: boolean): GraphQLInputObjectType;
export default buildMutationInputType;
