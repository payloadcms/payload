import React from 'react';
export declare const OperationContext: React.Context<Operation>;
export declare const OperationProvider: React.FC<{
    children: React.ReactNode;
    operation: Operation;
}>;
export type Operation = 'create' | 'update';
export declare const useOperation: () => Operation | undefined;
//# sourceMappingURL=index.d.ts.map