import { type PaginatedDocs, type PayloadRequest, type SelectType, type Sort, type TypedUser, type TypeWithVersion, type Where } from 'payload';
export declare const fetchVersion: <TVersionData extends object = object>({ id, collectionSlug, depth, globalSlug, locale, overrideAccess, req, select, user, }: {
    collectionSlug?: string;
    depth?: number;
    globalSlug?: string;
    id: number | string;
    locale?: "all" | ({} & string);
    overrideAccess?: boolean;
    req: PayloadRequest;
    select?: SelectType;
    user?: TypedUser;
}) => Promise<null | TypeWithVersion<TVersionData>>;
export declare const fetchVersions: <TVersionData extends object = object>({ collectionSlug, depth, draft, globalSlug, limit, locale, overrideAccess, page, parentID, req, select, sort, user, where: whereFromArgs, }: {
    collectionSlug?: string;
    depth?: number;
    draft?: boolean;
    globalSlug?: string;
    limit?: number;
    locale?: "all" | ({} & string);
    overrideAccess?: boolean;
    page?: number;
    parentID?: number | string;
    req: PayloadRequest;
    select?: SelectType;
    sort?: Sort;
    user?: TypedUser;
    where?: Where;
}) => Promise<null | PaginatedDocs<TypeWithVersion<TVersionData>>>;
export declare const fetchLatestVersion: <TVersionData extends object = object>({ collectionSlug, depth, globalSlug, locale, overrideAccess, parentID, req, select, status, user, where, }: {
    collectionSlug?: string;
    depth?: number;
    globalSlug?: string;
    locale?: "all" | ({} & string);
    overrideAccess?: boolean;
    parentID?: number | string;
    req: PayloadRequest;
    select?: SelectType;
    status: "draft" | "published";
    user?: TypedUser;
    where?: Where;
}) => Promise<null | TypeWithVersion<TVersionData>>;
//# sourceMappingURL=fetchVersions.d.ts.map