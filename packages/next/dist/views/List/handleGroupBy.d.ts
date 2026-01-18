import type { ClientCollectionConfig, ClientConfig, Column, ListQuery, PaginatedDocs, PayloadRequest, SanitizedCollectionConfig, SanitizedFieldsPermissions, SelectType, ViewTypes, Where } from 'payload';
export declare const handleGroupBy: ({ clientCollectionConfig, clientConfig, collectionConfig, collectionSlug, columns, customCellProps, drawerSlug, enableRowSelections, fieldPermissions, query, req, select, trash, user, viewType, where: whereWithMergedSearch, }: {
    clientCollectionConfig: ClientCollectionConfig;
    clientConfig: ClientConfig;
    collectionConfig: SanitizedCollectionConfig;
    collectionSlug: string;
    columns: any[];
    customCellProps?: Record<string, any>;
    drawerSlug?: string;
    enableRowSelections?: boolean;
    fieldPermissions?: SanitizedFieldsPermissions;
    query?: ListQuery;
    req: PayloadRequest;
    select?: SelectType;
    trash?: boolean;
    user: any;
    viewType?: ViewTypes;
    where: Where;
}) => Promise<{
    columnState: Column[];
    data: PaginatedDocs;
    Table: null | React.ReactNode | React.ReactNode[];
}>;
//# sourceMappingURL=handleGroupBy.d.ts.map