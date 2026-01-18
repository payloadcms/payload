import type { I18nClient } from '@payloadcms/translations';
import type { StaticDescription } from '../../admin/types.js';
import type { ImportMap } from '../../bin/generateImportMap/index.js';
import type { LivePreviewConfig, ServerOnlyLivePreviewProperties, StaticLabel } from '../../config/types.js';
import type { ClientField } from '../../fields/config/client.js';
import type { Payload } from '../../types/index.js';
import type { SanitizedCollectionConfig } from './types.js';
export type ServerOnlyCollectionProperties = keyof Pick<SanitizedCollectionConfig, 'access' | 'custom' | 'endpoints' | 'flattenedFields' | 'hooks' | 'indexes' | 'joins' | 'polymorphicJoins' | 'sanitizedIndexes'>;
export type ServerOnlyCollectionAdminProperties = keyof Pick<SanitizedCollectionConfig['admin'], 'baseFilter' | 'baseListFilter' | 'components' | 'formatDocURL' | 'hidden'>;
export type ServerOnlyUploadProperties = keyof Pick<SanitizedCollectionConfig['upload'], 'adminThumbnail' | 'externalFileHeaderFilter' | 'handlers' | 'modifyResponseHeaders' | 'withMetadata'>;
export type ClientCollectionConfig = {
    admin: {
        description?: StaticDescription;
        livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>;
        preview?: boolean;
    } & Omit<SanitizedCollectionConfig['admin'], 'components' | 'description' | 'formatDocURL' | 'joins' | 'livePreview' | 'preview' | ServerOnlyCollectionAdminProperties>;
    auth?: {
        verify?: true;
    } & Omit<SanitizedCollectionConfig['auth'], 'forgotPassword' | 'strategies' | 'verify'>;
    fields: ClientField[];
    labels: {
        plural: StaticLabel;
        singular: StaticLabel;
    };
} & Omit<SanitizedCollectionConfig, 'admin' | 'auth' | 'fields' | 'labels' | ServerOnlyCollectionProperties>;
export declare const createClientCollectionConfig: ({ collection, defaultIDType, i18n, importMap, }: {
    collection: SanitizedCollectionConfig;
    defaultIDType: Payload["config"]["db"]["defaultIDType"];
    i18n: I18nClient;
    importMap: ImportMap;
}) => ClientCollectionConfig;
export declare const createClientCollectionConfigs: ({ collections, defaultIDType, i18n, importMap, }: {
    collections: SanitizedCollectionConfig[];
    defaultIDType: Payload["config"]["db"]["defaultIDType"];
    i18n: I18nClient;
    importMap: ImportMap;
}) => ClientCollectionConfig[];
//# sourceMappingURL=client.d.ts.map