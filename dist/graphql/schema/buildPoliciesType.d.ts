import { GraphQLObjectType } from 'graphql';
import { CollectionConfig } from '../../collections/config/types';
import { GlobalConfig } from '../../globals/config/types';
import { Field } from '../../fields/config/types';
import { Payload } from '../../payload';
type OperationType = 'create' | 'read' | 'update' | 'delete' | 'unlock' | 'readVersions';
type AccessScopes = 'docAccess' | undefined;
type BuildEntityPolicy = {
    name: string;
    entityFields: Field[];
    operations: OperationType[];
    scope: AccessScopes;
};
export declare const buildEntityPolicy: (args: BuildEntityPolicy) => {
    fields: {
        type: GraphQLObjectType<any, any>;
    };
};
type BuildPolicyType = {
    typeSuffix?: string;
    scope?: AccessScopes;
} & ({
    entity: CollectionConfig;
    type: 'collection';
} | {
    entity: GlobalConfig;
    type: 'global';
});
export declare function buildPolicyType(args: BuildPolicyType): GraphQLObjectType;
export default function buildPoliciesType(payload: Payload): GraphQLObjectType;
export {};
