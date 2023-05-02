/// <reference types="react" />
export declare const OperationContext: import("react").Context<any>;
export type Operation = 'create' | 'update';
export declare const useOperation: () => Operation | undefined;
