import type { I18nClient } from '@payloadcms/translations';
import type { ImportMap } from '../../bin/generateImportMap/index.js';
import type { LivePreviewConfig, SanitizedConfig, ServerOnlyLivePreviewProperties } from '../../config/types.js';
import type { Payload } from '../../types/index.js';
import type { SanitizedGlobalConfig } from './types.js';
import { type ClientField } from '../../fields/config/client.js';
export type ServerOnlyGlobalProperties = keyof Pick<SanitizedGlobalConfig, 'access' | 'admin' | 'custom' | 'endpoints' | 'fields' | 'flattenedFields' | 'hooks'>;
export type ServerOnlyGlobalAdminProperties = keyof Pick<SanitizedGlobalConfig['admin'], 'components' | 'hidden'>;
export type ClientGlobalConfig = {
    admin: {
        components: null;
        livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>;
        preview?: boolean;
    } & Omit<SanitizedGlobalConfig['admin'], 'components' | 'livePreview' | 'preview' | ServerOnlyGlobalAdminProperties>;
    fields: ClientField[];
} & Omit<SanitizedGlobalConfig, 'admin' | 'fields' | ServerOnlyGlobalProperties>;
export declare const createClientGlobalConfig: ({ defaultIDType, global, i18n, importMap, }: {
    defaultIDType: Payload["config"]["db"]["defaultIDType"];
    global: SanitizedConfig["globals"][0];
    i18n: I18nClient;
    importMap: ImportMap;
}) => ClientGlobalConfig;
export declare const createClientGlobalConfigs: ({ defaultIDType, globals, i18n, importMap, }: {
    defaultIDType: Payload["config"]["db"]["defaultIDType"];
    globals: SanitizedConfig["globals"];
    i18n: I18nClient;
    importMap: ImportMap;
}) => ClientGlobalConfig[];
//# sourceMappingURL=client.d.ts.map