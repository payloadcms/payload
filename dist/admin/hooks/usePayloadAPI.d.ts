/// <reference types="react" />
type Result = [
    {
        isLoading: boolean;
        isError: boolean;
        data: any;
    },
    {
        setParams: React.Dispatch<unknown>;
    }
];
type Options = {
    initialParams?: unknown;
    initialData?: any;
};
type UsePayloadAPI = (url: string, options?: Options) => Result;
declare const usePayloadAPI: UsePayloadAPI;
export default usePayloadAPI;
