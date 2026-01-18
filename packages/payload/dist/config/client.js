import { createClientCollectionConfigs } from '../collections/config/client.js';
import { createClientBlocks } from '../fields/config/client.js';
import { createClientGlobalConfigs } from '../globals/config/client.js';
export const serverOnlyAdminConfigProperties = [];
export const serverOnlyConfigProperties = [
    'endpoints',
    'db',
    'editor',
    'plugins',
    'sharp',
    'onInit',
    'secret',
    'hooks',
    'bin',
    'i18n',
    'typescript',
    'cors',
    'csrf',
    'email',
    'custom',
    'graphQL',
    'jobs',
    'logger',
    'kv',
    'queryPresets'
];
export const createUnauthenticatedClientConfig = ({ clientConfig })=>{
    /**
   * To share memory, find the admin user collection from the existing client config.
   */ const adminUserCollection = clientConfig.collections.find(({ slug })=>slug === clientConfig.admin.user);
    return {
        admin: {
            routes: clientConfig.admin.routes,
            user: clientConfig.admin.user
        },
        collections: [
            {
                slug: adminUserCollection.slug,
                auth: adminUserCollection.auth
            }
        ],
        globals: [],
        routes: clientConfig.routes,
        serverURL: clientConfig.serverURL,
        unauthenticated: true
    };
};
export const createClientConfig = ({ config, i18n, importMap })=>{
    const clientConfig = {};
    for(const key in config){
        if (serverOnlyConfigProperties.includes(key)) {
            continue;
        }
        switch(key){
            case 'admin':
                clientConfig.admin = {
                    autoLogin: config.admin.autoLogin,
                    autoRefresh: config.admin.autoRefresh,
                    avatar: config.admin.avatar,
                    custom: config.admin.custom,
                    dateFormat: config.admin.dateFormat,
                    importMap: config.admin.importMap,
                    meta: config.admin.meta,
                    routes: config.admin.routes,
                    theme: config.admin.theme,
                    timezones: config.admin.timezones,
                    toast: config.admin.toast,
                    user: config.admin.user
                };
                if (config.admin.dashboard?.widgets) {
                    ;
                    (clientConfig.admin.dashboard ??= {}).widgets = config.admin.dashboard.widgets.map((widget)=>{
                        const { ComponentPath: _, label, ...rest } = widget;
                        return {
                            ...rest,
                            // Resolve label function to string for client
                            label: typeof label === 'function' ? label({
                                i18n,
                                t: i18n.t
                            }) : label
                        };
                    });
                }
                if (config.admin.livePreview) {
                    clientConfig.admin.livePreview = {};
                    if (config.admin.livePreview.breakpoints) {
                        clientConfig.admin.livePreview.breakpoints = config.admin.livePreview.breakpoints;
                    }
                    if (config.admin.livePreview.collections) {
                        clientConfig.admin.livePreview.collections = config.admin.livePreview.collections;
                    }
                    if (config.admin.livePreview.globals) {
                        clientConfig.admin.livePreview.globals = config.admin.livePreview.globals;
                    }
                }
                break;
            case 'blocks':
                {
                    ;
                    clientConfig.blocks = createClientBlocks({
                        blocks: config.blocks,
                        defaultIDType: config.db.defaultIDType,
                        i18n,
                        importMap
                    }).filter((block)=>typeof block !== 'string');
                    clientConfig.blocksMap = {};
                    if (clientConfig.blocks?.length) {
                        for (const block of clientConfig.blocks){
                            if (!block?.slug) {
                                continue;
                            }
                            clientConfig.blocksMap[block.slug] = block;
                        }
                    }
                    break;
                }
            case 'collections':
                ;
                clientConfig.collections = createClientCollectionConfigs({
                    collections: config.collections,
                    defaultIDType: config.db.defaultIDType,
                    i18n,
                    importMap
                });
                break;
            case 'folders':
                if (config.folders) {
                    clientConfig.folders = {
                        slug: config.folders.slug,
                        browseByFolder: config.folders.browseByFolder,
                        debug: config.folders.debug,
                        fieldName: config.folders.fieldName
                    };
                }
                break;
            case 'globals':
                ;
                clientConfig.globals = createClientGlobalConfigs({
                    defaultIDType: config.db.defaultIDType,
                    globals: config.globals,
                    i18n,
                    importMap
                });
                break;
            case 'localization':
                if (typeof config.localization === 'object' && config.localization) {
                    clientConfig.localization = {};
                    if (config.localization.defaultLocale) {
                        clientConfig.localization.defaultLocale = config.localization.defaultLocale;
                    }
                    if (config.localization.defaultLocalePublishOption) {
                        clientConfig.localization.defaultLocalePublishOption = config.localization.defaultLocalePublishOption;
                    }
                    if (config.localization.fallback) {
                        clientConfig.localization.fallback = config.localization.fallback;
                    }
                    if (config.localization.localeCodes) {
                        clientConfig.localization.localeCodes = config.localization.localeCodes;
                    }
                    if (config.localization.locales) {
                        clientConfig.localization.locales = [];
                        for (const locale of config.localization.locales){
                            if (locale) {
                                const clientLocale = {};
                                if (locale.code) {
                                    clientLocale.code = locale.code;
                                }
                                if (locale.fallbackLocale) {
                                    clientLocale.fallbackLocale = locale.fallbackLocale;
                                }
                                if (locale.label) {
                                    clientLocale.label = locale.label;
                                }
                                if (locale.rtl) {
                                    clientLocale.rtl = locale.rtl;
                                }
                                clientConfig.localization.locales.push(clientLocale);
                            }
                        }
                    }
                }
                break;
            default:
                ;
                clientConfig[key] = config[key];
        }
    }
    return clientConfig;
};

//# sourceMappingURL=client.js.map