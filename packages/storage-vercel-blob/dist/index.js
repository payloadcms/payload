import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage';
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities';
import { getGenerateUrl } from './generateURL.js';
import { getClientUploadRoute } from './getClientUploadRoute.js';
import { getHandleDelete } from './handleDelete.js';
import { getHandleUpload } from './handleUpload.js';
import { getStaticHandler } from './staticHandler.js';
const defaultUploadOptions = {
    access: 'public',
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
    enabled: true
};
export const vercelBlobStorage = (options)=>(incomingConfig)=>{
        // Parse storeId from token
        const storeId = options.token?.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase();
        const isPluginDisabled = options.enabled === false || !options.token;
        // Don't throw if the plugin is disabled
        if (!storeId && !isPluginDisabled) {
            throw new Error('Invalid token format for Vercel Blob adapter. Should be vercel_blob_rw_<store_id>_<random_string>.');
        }
        const optionsWithDefaults = {
            ...defaultUploadOptions,
            ...options
        };
        const baseUrl = `https://${storeId}.${optionsWithDefaults.access}.blob.vercel-storage.com`;
        initClientUploads({
            clientHandler: '@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler',
            collections: options.collections,
            config: incomingConfig,
            enabled: !isPluginDisabled && Boolean(options.clientUploads),
            extraClientHandlerProps: (collection)=>({
                    addRandomSuffix: !!optionsWithDefaults.addRandomSuffix,
                    baseURL: baseUrl,
                    prefix: typeof collection === 'object' && collection.prefix && `${collection.prefix}/` || ''
                }),
            serverHandler: getClientUploadRoute({
                access: typeof options.clientUploads === 'object' ? options.clientUploads.access : undefined,
                addRandomSuffix: optionsWithDefaults.addRandomSuffix,
                cacheControlMaxAge: options.cacheControlMaxAge,
                token: options.token ?? ''
            }),
            serverHandlerPath: '/vercel-blob-client-upload-route'
        });
        // If the plugin is disabled or no token is provided, do not enable the plugin
        if (isPluginDisabled) {
            return incomingConfig;
        }
        const adapter = vercelBlobStorageInternal({
            ...optionsWithDefaults,
            baseUrl
        });
        // Add adapter to each collection option object
        const collectionsWithAdapter = Object.entries(options.collections).reduce((acc, [slug, collOptions])=>({
                ...acc,
                [slug]: {
                    ...collOptions === true ? {} : collOptions,
                    adapter
                }
            }), {});
        // Set disableLocalStorage: true for collections specified in the plugin options
        const config = {
            ...incomingConfig,
            collections: (incomingConfig.collections || []).map((collection)=>{
                if (!collectionsWithAdapter[collection.slug]) {
                    return collection;
                }
                return {
                    ...collection,
                    upload: {
                        ...typeof collection.upload === 'object' ? collection.upload : {},
                        disableLocalStorage: true
                    }
                };
            })
        };
        return cloudStoragePlugin({
            alwaysInsertFields: options.alwaysInsertFields,
            collections: collectionsWithAdapter
        })(config);
    };
function vercelBlobStorageInternal(options) {
    return ({ collection, prefix })=>{
        const { access, addRandomSuffix, baseUrl, cacheControlMaxAge, clientUploads, token } = options;
        if (!token) {
            throw new Error('Vercel Blob storage token is required');
        }
        return {
            name: 'vercel-blob',
            clientUploads,
            generateURL: getGenerateUrl({
                baseUrl,
                prefix
            }),
            handleDelete: getHandleDelete({
                baseUrl,
                prefix,
                token
            }),
            handleUpload: getHandleUpload({
                access,
                addRandomSuffix,
                baseUrl,
                cacheControlMaxAge,
                prefix,
                token
            }),
            staticHandler: getStaticHandler({
                baseUrl,
                cacheControlMaxAge,
                token
            }, collection)
        };
    };
}

//# sourceMappingURL=index.js.map