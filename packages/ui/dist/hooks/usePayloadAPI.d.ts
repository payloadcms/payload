import type React from 'react';
type Result = [
    {
        data: any;
        isError: boolean;
        isLoading: boolean;
    },
    {
        setParams: React.Dispatch<unknown>;
    }
];
type Options = {
    initialData?: any;
    initialParams?: unknown;
};
type UsePayloadAPI = (url: string, options?: Options) => Result;
export declare const usePayloadAPI: UsePayloadAPI;
export {};
//# sourceMappingURL=usePayloadAPI.d.ts.map