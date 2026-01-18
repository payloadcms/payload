import React from 'react';
type ClientFunctionsContextType = Record<string, any>;
export declare const ClientFunctionProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useAddClientFunction: (key: string, func: any) => void;
export declare const useClientFunctions: () => ClientFunctionsContextType;
export {};
//# sourceMappingURL=index.d.ts.map