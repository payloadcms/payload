import type { ClientCollectionConfig, ListQuery, PaginatedDocs, Sort, Where } from 'payload';
type ContextHandlers = {
    handlePageChange?: (page: number) => Promise<void>;
    handlePerPageChange?: (limit: number) => Promise<void>;
    handleSearchChange?: (search: string) => Promise<void>;
    handleSortChange?: (sort: string) => Promise<void>;
    handleWhereChange?: (where: Where) => Promise<void>;
};
export type OnListQueryChange = (query: ListQuery) => void;
export type ListQueryProps = {
    readonly children: React.ReactNode;
    readonly collectionSlug?: ClientCollectionConfig['slug'];
    readonly data: PaginatedDocs | undefined;
    readonly modifySearchParams?: boolean;
    readonly onQueryChange?: OnListQueryChange;
    readonly orderableFieldName?: string;
    /**
     * @deprecated
     */
    readonly preferenceKey?: string;
    readonly query?: ListQuery;
};
export type IListQueryContext = {
    collectionSlug: ClientCollectionConfig['slug'];
    data: ListQueryProps['data'];
    defaultLimit?: number;
    defaultSort?: Sort;
    /**
     * @experimental This prop is subject to change. Use at your own risk.
     */
    isGroupingBy: boolean;
    modified: boolean;
    orderableFieldName?: string;
    query: ListQuery;
    refineListData: (args: ListQuery, setModified?: boolean) => Promise<void>;
    setModified: (modified: boolean) => void;
} & ContextHandlers;
export {};
//# sourceMappingURL=types.d.ts.map