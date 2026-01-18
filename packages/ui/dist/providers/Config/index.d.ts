import type { ClientCollectionConfig, ClientConfig, ClientGlobalConfig, CollectionSlug, GlobalSlug } from 'payload';
import React from 'react';
type GetEntityConfigFn = {
    (args: {
        collectionSlug: {} | CollectionSlug;
        globalSlug?: never;
    }): ClientCollectionConfig;
    (args: {
        collectionSlug?: never;
        globalSlug: {} | GlobalSlug;
    }): ClientGlobalConfig;
    (args: {
        collectionSlug?: {} | CollectionSlug;
        globalSlug?: {} | GlobalSlug;
    }): ClientCollectionConfig | ClientGlobalConfig | null;
};
export type ClientConfigContext = {
    config: ClientConfig;
    /**
     * Get a collection or global config by its slug. This is preferred over
     * using `config.collections.find` or `config.globals.find`, because
     * getEntityConfig uses a lookup map for O(1) lookups.
     */
    getEntityConfig: GetEntityConfigFn;
    setConfig: (config: ClientConfig) => void;
};
export declare const ConfigProvider: React.FC<{
    readonly children: React.ReactNode;
    readonly config: ClientConfig;
}>;
export declare const useConfig: () => ClientConfigContext;
/**
 * This provider shadows the `ConfigProvider` on the _page_ level, allowing us to
 * update the config when needed, e.g. after authentication.
 * The layout `ConfigProvider` is not updated on page navigation / authentication,
 * as the layout does not re-render in those cases.
 *
 * If the config here has the same reference as the config from the layout, we
 * simply reuse the context from the layout to avoid unnecessary re-renders.
 *
 * @experimental This component is experimental and may change or be removed in future releases. Use at your own risk.
 */
export declare const PageConfigProvider: React.FC<{
    readonly children: React.ReactNode;
    readonly config: ClientConfig;
}>;
export {};
//# sourceMappingURL=index.d.ts.map