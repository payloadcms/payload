import type { BuildTableStateArgs, ClientConfig, CollectionPreferences, Column, ErrorResult, PaginatedDocs, ServerFunction } from 'payload';
type BuildTableStateSuccessResult = {
    clientConfig?: ClientConfig;
    data: PaginatedDocs;
    errors?: never;
    preferences: CollectionPreferences;
    renderedFilters: Map<string, React.ReactNode>;
    state: Column[];
    Table: React.ReactNode;
};
type BuildTableStateErrorResult = {
    data?: any;
    renderedFilters?: never;
    state?: never;
    Table?: never;
} & ({
    message: string;
} | ErrorResult);
export type BuildTableStateResult = BuildTableStateErrorResult | BuildTableStateSuccessResult;
export declare const buildTableStateHandler: ServerFunction<BuildTableStateArgs, Promise<BuildTableStateResult>>;
export {};
//# sourceMappingURL=buildTableState.d.ts.map