import type { CollectionConfig, Field, GlobalConfig, SanitizedConfig } from 'payload';
import { GraphQLObjectType } from 'graphql';
type OperationType = 'create' | 'delete' | 'read' | 'readVersions' | 'unlock' | 'update';
type AccessScopes = 'docAccess' | undefined;
type BuildEntityPolicy = {
    entityFields: Field[];
    name: string;
    operations: OperationType[];
    scope: AccessScopes;
};
export declare const buildEntityPolicy: (args: BuildEntityPolicy) => {
    fields: {
        type: GraphQLObjectType<any, any>;
    };
};
type BuildPolicyType = {
    scope?: AccessScopes;
    typeSuffix?: string;
} & ({
    entity: CollectionConfig;
    type: 'collection';
} | {
    entity: GlobalConfig;
    type: 'global';
});
export declare function buildPolicyType(args: BuildPolicyType): GraphQLObjectType;
export declare function buildPoliciesType(config: SanitizedConfig): GraphQLObjectType;
export {};
//# sourceMappingURL=buildPoliciesType.d.ts.map