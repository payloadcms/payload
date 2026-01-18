import type { I18nClient } from '@payloadcms/translations';
import type { ClientCollectionConfig, ClientConfig, ColumnPreference, SanitizedPermissions } from 'payload';
export declare const getColumns: ({ clientConfig, collectionConfig, collectionSlug, columns, i18n, permissions, }: {
    clientConfig: ClientConfig;
    collectionConfig?: ClientCollectionConfig;
    collectionSlug: string | string[];
    columns: ColumnPreference[];
    i18n: I18nClient;
    permissions?: SanitizedPermissions;
}) => ColumnPreference[];
//# sourceMappingURL=getColumns.d.ts.map