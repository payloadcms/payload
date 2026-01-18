import type { OperationArgs } from 'graphql-http';
import type { SanitizedConfig } from 'payload';
import * as GraphQL from 'graphql';
export declare function configToSchema(config: SanitizedConfig): {
    schema: GraphQL.GraphQLSchema;
    validationRules: (args: OperationArgs<any>) => GraphQL.ValidationRule[];
};
//# sourceMappingURL=index.d.ts.map