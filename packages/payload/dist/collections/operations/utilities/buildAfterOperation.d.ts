import type { CollectionSlug } from '../../../index.js';
import type { AfterOperationArg, OperationMap, OperationResult } from './types.js';
export declare const buildAfterOperation: <TOperationGeneric extends CollectionSlug, O extends keyof OperationMap<TOperationGeneric> = keyof OperationMap<TOperationGeneric>>(operationArgs: {
    operation: O;
} & Omit<AfterOperationArg<TOperationGeneric>, "req">) => Promise<any | OperationResult<TOperationGeneric, O>>;
//# sourceMappingURL=buildAfterOperation.d.ts.map