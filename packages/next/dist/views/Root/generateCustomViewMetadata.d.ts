import type { I18nClient } from '@payloadcms/translations';
import type { Metadata } from 'next';
import type { AdminViewConfig, SanitizedCollectionConfig, SanitizedConfig, SanitizedGlobalConfig } from 'payload';
export declare const generateCustomViewMetadata: (args: {
    collectionConfig?: SanitizedCollectionConfig;
    config: SanitizedConfig;
    globalConfig?: SanitizedGlobalConfig;
    i18n: I18nClient;
    viewConfig: AdminViewConfig;
}) => Promise<Metadata>;
//# sourceMappingURL=generateCustomViewMetadata.d.ts.map