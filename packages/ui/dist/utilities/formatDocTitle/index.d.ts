import type { I18n } from '@payloadcms/translations';
import type { ClientCollectionConfig, ClientGlobalConfig, SanitizedConfig, TypeWithID } from 'payload';
export declare const formatDocTitle: ({ collectionConfig, data, dateFormat: dateFormatFromConfig, fallback, globalConfig, i18n, }: {
    collectionConfig?: ClientCollectionConfig;
    data: TypeWithID;
    dateFormat: SanitizedConfig["admin"]["dateFormat"];
    fallback?: object | string;
    globalConfig?: ClientGlobalConfig;
    i18n: I18n<any, any>;
}) => string;
//# sourceMappingURL=index.d.ts.map