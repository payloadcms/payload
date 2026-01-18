import type { CollectionSlug } from '../../../index.js';
import type { BeforeOperationArg, OperationArgs, OperationMap } from './types.js';
/**
 * TODO V4: remove overloads and operations should be the literal operation that was called
 *
 * - `read`: replace with `find` and `findByID` in both operations
 * - `delete`: replace with `deleteByID` in deleteByID operation
 * - `update`: replace with `updateByID` in updateByID operation
 */
/**
 * @deprecated
 *
 * Should use `find` or `findByID`
 */
export declare function buildBeforeOperation<TOperationGeneric extends CollectionSlug, TArgs>(operationArgs: {
    args: TArgs;
    operation: 'read';
} & Omit<BeforeOperationArg<TOperationGeneric>, 'args' | 'context' | 'operation' | 'req'>): Promise<TArgs>;
/**
 * Overload for 'readDistinct' operation
 *
 * @deprecated - use `findDistinct`
 */
export declare function buildBeforeOperation<TOperationGeneric extends CollectionSlug, TArgs>(operationArgs: {
    args: TArgs;
    operation: 'readDistinct';
} & Omit<BeforeOperationArg<TOperationGeneric>, 'args' | 'context' | 'operation' | 'req'>): Promise<TArgs>;
export declare function buildBeforeOperation<TOperationGeneric extends CollectionSlug, TArgs>(operationArgs: {
    args: TArgs;
    operation: 'update';
} & Omit<BeforeOperationArg<TOperationGeneric>, 'args' | 'context' | 'operation' | 'req'>): Promise<TArgs>;
export declare function buildBeforeOperation<TOperationGeneric extends CollectionSlug, TArgs>(operationArgs: {
    args: TArgs;
    operation: 'updateByID';
} & Omit<BeforeOperationArg<TOperationGeneric>, 'args' | 'context' | 'operation' | 'req'>): Promise<TArgs>;
export declare function buildBeforeOperation<TOperationGeneric extends CollectionSlug, TArgs>(operationArgs: {
    args: TArgs;
    operation: 'delete';
} & Omit<BeforeOperationArg<TOperationGeneric>, 'args' | 'context' | 'operation' | 'req'>): Promise<TArgs>;
export declare function buildBeforeOperation<TOperationGeneric extends CollectionSlug, TArgs>(operationArgs: {
    args: TArgs;
    operation: 'deleteByID';
} & Omit<BeforeOperationArg<TOperationGeneric>, 'args' | 'context' | 'operation' | 'req'>): Promise<TArgs>;
export declare function buildBeforeOperation<TOperationGeneric extends CollectionSlug, O extends keyof OperationMap<TOperationGeneric>>(operationArgs: {
    operation: O;
} & Omit<BeforeOperationArg<TOperationGeneric>, 'context' | 'req'>): Promise<OperationArgs<TOperationGeneric, O>>;
//# sourceMappingURL=buildBeforeOperation.d.ts.map