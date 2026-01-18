export interface ErrorWithCode extends Error {
    code?: number | string;
}
export declare function isError(err: unknown): err is ErrorWithCode;
//# sourceMappingURL=isError.d.ts.map