import { Storage } from '@google-cloud/storage';
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage';
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities';
import { getGenerateSignedURLHandler } from './generateSignedURL.js';
import { getGenerateURL } from './generateURL.js';
import { getHandleDelete } from './handleDelete.js';
import { getHandleUpload } from './handleUpload.js';
import { getHandler } from './staticHandler.js';
const gcsClients = new Map();
export const gcsStorage = (gcsStorageOptions)=>(incomingConfig)=>{
        const cacheKey = gcsStorageOptions.clientCacheKey || `gcs:${gcsStorageOptions.bucket}`;
        const getStorageClient = ()=>{
            if (gcsClients.has(cacheKey)) {
                return gcsClients.get(cacheKey);
            }
            gcsClients.set(cacheKey, new Storage(gcsStorageOptions.options));
            return gcsClients.get(cacheKey);
        };
        const adapter = gcsStorageInternal(getStorageClient, gcsStorageOptions);
        const isPluginDisabled = gcsStorageOptions.enabled === false;
        initClientUploads({
            clientHandler: '@payloadcms/storage-gcs/client#GcsClientUploadHandler',
            collections: gcsStorageOptions.collections,
            config: incomingConfig,
            enabled: !isPluginDisabled && Boolean(gcsStorageOptions.clientUploads),
            serverHandler: getGenerateSignedURLHandler({
                access: typeof gcsStorageOptions.clientUploads === 'object' ? gcsStorageOptions.clientUploads.access : undefined,
                bucket: gcsStorageOptions.bucket,
                collections: gcsStorageOptions.collections,
                getStorageClient
            }),
            serverHandlerPath: '/storage-gcs-generate-signed-url'
        });
        if (isPluginDisabled) {
            return incomingConfig;
        }
        // Add adapter to each collection option object
        const collectionsWithAdapter = Object.entries(gcsStorageOptions.collections).reduce((acc, [slug, collOptions])=>({
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
            alwaysInsertFields: gcsStorageOptions.alwaysInsertFields,
            collections: collectionsWithAdapter
        })(config);
    };
function gcsStorageInternal(getStorageClient, { acl, bucket, clientUploads }) {
    return ({ collection, prefix })=>{
        return {
            name: 'gcs',
            clientUploads,
            generateURL: getGenerateURL({
                bucket,
                getStorageClient
            }),
            handleDelete: getHandleDelete({
                bucket,
                getStorageClient
            }),
            handleUpload: getHandleUpload({
                acl,
                bucket,
                collection,
                getStorageClient,
                prefix
            }),
            staticHandler: getHandler({
                bucket,
                collection,
                getStorageClient
            })
        };
    };
}

//# sourceMappingURL=index.js.map