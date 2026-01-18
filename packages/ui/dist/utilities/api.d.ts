type GetOptions = {
    params?: Record<string, unknown>;
} & RequestInit;
export declare const requests: {
    delete: (url: string, options?: RequestInit) => Promise<Response>;
    get: (url: string, options?: GetOptions) => Promise<Response>;
    patch: (url: string, options?: RequestInit) => Promise<Response>;
    post: (url: string, options?: RequestInit) => Promise<Response>;
    put: (url: string, options?: RequestInit) => Promise<Response>;
};
export {};
//# sourceMappingURL=api.d.ts.map