import type { I18n } from '@payloadcms/translations';
import type { PaginatedDocs, SanitizedCollectionConfig, SanitizedConfig, SanitizedGlobalConfig, TypedUser } from 'payload';
export type DefaultVersionsViewProps = {
    canAccessAdmin: boolean;
    collectionConfig?: SanitizedCollectionConfig;
    config: SanitizedConfig;
    data: Document;
    editURL: string;
    entityLabel: string;
    globalConfig?: SanitizedGlobalConfig;
    i18n: I18n;
    id: number | string;
    limit: number;
    user: TypedUser;
    versionsData: PaginatedDocs<Document>;
};
//# sourceMappingURL=types.d.ts.map