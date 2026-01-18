/**
 * Created by Ivo Meißner on 28.07.17.
 */
import type { DocumentNode, FieldNode, FragmentDefinitionNode, GraphQLCompositeType, GraphQLDirective, GraphQLField, GraphQLSchema, GraphQLUnionType, InlineFragmentNode, OperationDefinitionNode } from 'graphql';
import { GraphQLError, GraphQLInterfaceType, GraphQLObjectType, ValidationContext } from 'graphql';
export type ComplexityEstimatorArgs = {
    args: {
        [key: string]: any;
    };
    childComplexity: number;
    context?: Record<string, any>;
    field: GraphQLField<any, any>;
    node: FieldNode;
    type: GraphQLCompositeType;
};
export type ComplexityEstimator = (options: ComplexityEstimatorArgs) => number | void;
export type Complexity = any;
export interface QueryComplexityOptions {
    context?: Record<string, any>;
    createError?: (max: number, actual: number) => GraphQLError;
    estimators: Array<ComplexityEstimator>;
    maximumComplexity: number;
    onComplete?: (complexity: number) => void;
    operationName?: string;
    variables?: Record<string, any>;
}
export declare function getComplexity(options: {
    context?: Record<string, any>;
    estimators: ComplexityEstimator[];
    operationName?: string;
    query: DocumentNode;
    schema: GraphQLSchema;
    variables?: Record<string, any>;
}): number;
export declare class QueryComplexity {
    complexity: number;
    context: ValidationContext;
    estimators: Array<ComplexityEstimator>;
    includeDirectiveDef: GraphQLDirective;
    OperationDefinition: Record<string, any>;
    options: QueryComplexityOptions;
    requestContext?: Record<string, any>;
    skipDirectiveDef: GraphQLDirective;
    variableValues: Record<string, any>;
    constructor(context: ValidationContext, options: QueryComplexityOptions);
    createError(): GraphQLError;
    nodeComplexity(node: FieldNode | FragmentDefinitionNode | InlineFragmentNode | OperationDefinitionNode, typeDef: GraphQLInterfaceType | GraphQLObjectType | GraphQLUnionType): number;
    onOperationDefinitionEnter(operation: OperationDefinitionNode): void;
    onOperationDefinitionLeave(operation: OperationDefinitionNode): GraphQLError | void;
}
//# sourceMappingURL=QueryComplexity.d.ts.map