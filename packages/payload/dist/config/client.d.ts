import type { I18nClient } from '@payloadcms/translations';
import type { ImportMap } from '../bin/generateImportMap/index.js';
import type { ClientBlock } from '../fields/config/types.js';
import type { BlockSlug, TypedUser } from '../index.js';
import type { RootLivePreviewConfig, SanitizedConfig, SanitizedDashboardConfig, ServerOnlyLivePreviewProperties } from './types.js';
import { type ClientCollectionConfig } from '../collections/config/client.js';
import { type ClientGlobalConfig } from '../globals/config/client.js';
export type ServerOnlyRootProperties = keyof Pick<SanitizedConfig, 'bin' | 'cors' | 'csrf' | 'custom' | 'db' | 'editor' | 'email' | 'endpoints' | 'graphQL' | 'hooks' | 'i18n' | 'jobs' | 'kv' | 'logger' | 'onInit' | 'plugins' | 'queryPresets' | 'secret' | 'sharp' | 'typescript'>;
export type ServerOnlyRootAdminProperties = keyof Pick<SanitizedConfig['admin'], 'components'>;
export type ClientConfig = {
    admin: {
        dashboard?: SanitizedDashboardConfig;
        livePreview?: Omit<RootLivePreviewConfig, ServerOnlyLivePreviewProperties>;
    } & Omit<SanitizedConfig['admin'], 'components' | 'dashboard' | 'dependencies' | 'livePreview'>;
    blocks: ClientBlock[];
    blocksMap: Record<BlockSlug, ClientBlock>;
    collections: ClientCollectionConfig[];
    custom?: Record<string, any>;
    globals: ClientGlobalConfig[];
    unauthenticated?: boolean;
} & Omit<SanitizedConfig, 'admin' | 'collections' | 'globals' | 'i18n' | ServerOnlyRootProperties>;
export type UnauthenticatedClientConfig = {
    admin: {
        routes: ClientConfig['admin']['routes'];
        user: ClientConfig['admin']['user'];
    };
    collections: [
        {
            auth: ClientCollectionConfig['auth'];
            slug: string;
        }
    ];
    globals: [];
    routes: ClientConfig['routes'];
    serverURL: ClientConfig['serverURL'];
    unauthenticated: true;
};
export declare const serverOnlyAdminConfigProperties: readonly Partial<ServerOnlyRootAdminProperties>[];
export declare const serverOnlyConfigProperties: readonly Partial<ServerOnlyRootProperties>[];
export type CreateClientConfigArgs = {
    config: SanitizedConfig;
    i18n: I18nClient;
    importMap: ImportMap;
    /**
     * If unauthenticated, the client config will omit some sensitive properties
     * such as field schemas, etc. This is useful for login and error pages where
     * the page source should not contain this information.
     *
     * For example, allow `true` to generate a client config for the "create first user" page
     * where there is no user yet, but the config should still be complete.
     */
    user: true | TypedUser;
};
export declare const createUnauthenticatedClientConfig: ({ clientConfig, }: {
    /**
     * Send the previously generated client config to share memory when applicable.
     * E.g. the admin-enabled collection config can reference the existing collection rather than creating a new object.
     */
    clientConfig: ClientConfig;
}) => UnauthenticatedClientConfig;
export declare const createClientConfig: ({ config, i18n, importMap, }: CreateClientConfigArgs) => ClientConfig;
//# sourceMappingURL=client.d.ts.map