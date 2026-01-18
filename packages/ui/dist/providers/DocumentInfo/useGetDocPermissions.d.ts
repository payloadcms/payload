import type { Data, SanitizedDocumentPermissions, SanitizedPermissions } from 'payload';
import React from 'react';
export type GetDocPermissions = (data?: Data) => Promise<void>;
export declare const useGetDocPermissions: ({ id, api, collectionSlug, globalSlug, i18n, locale, permissions, setDocPermissions, setHasPublishPermission, setHasSavePermission, }: {
    api: string;
    collectionSlug: string;
    globalSlug: string;
    i18n: any;
    id: string;
    locale: string;
    permissions: SanitizedPermissions;
    setDocPermissions: React.Dispatch<React.SetStateAction<SanitizedDocumentPermissions>>;
    setHasPublishPermission: React.Dispatch<React.SetStateAction<boolean>>;
    setHasSavePermission: React.Dispatch<React.SetStateAction<boolean>>;
}) => GetDocPermissions;
//# sourceMappingURL=useGetDocPermissions.d.ts.map