import * as AWS from '@aws-sdk/client-s3';
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage';
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities';
import { getGenerateSignedURLHandler } from './generateSignedURL.js';
import { getGenerateURL } from './generateURL.js';
import { getHandleDelete } from './handleDelete.js';
import { getHandleUpload } from './handleUpload.js';
import { getHandler } from './staticHandler.js';
const s3Clients = new Map();
const defaultRequestHandlerOpts = {
    httpAgent: {
        keepAlive: true,
        maxSockets: 100
    },
    httpsAgent: {
        keepAlive: true,
        maxSockets: 100
    }
};
export const s3Storage = (s3StorageOptions)=>(incomingConfig)=>{
        const cacheKey = s3StorageOptions.clientCacheKey || `s3:${s3StorageOptions.bucket}`;
        const getStorageClient = ()=>{
            if (s3Clients.has(cacheKey)) {
                return s3Clients.get(cacheKey);
            }
            s3Clients.set(cacheKey, new AWS.S3({
                requestHandler: defaultRequestHandlerOpts,
                ...s3StorageOptions.config ?? {}
            }));
            return s3Clients.get(cacheKey);
        };
        const isPluginDisabled = s3StorageOptions.enabled === false;
        initClientUploads({
            clientHandler: '@payloadcms/storage-s3/client#S3ClientUploadHandler',
            collections: s3StorageOptions.collections,
            config: incomingConfig,
            enabled: !isPluginDisabled && Boolean(s3StorageOptions.clientUploads),
            serverHandler: getGenerateSignedURLHandler({
                access: typeof s3StorageOptions.clientUploads === 'object' ? s3StorageOptions.clientUploads.access : undefined,
                acl: s3StorageOptions.acl,
                bucket: s3StorageOptions.bucket,
                collections: s3StorageOptions.collections,
                getStorageClient
            }),
            serverHandlerPath: '/storage-s3-generate-signed-url'
        });
        if (isPluginDisabled) {
            // If alwaysInsertFields is true, still call cloudStoragePlugin to insert fields
            if (s3StorageOptions.alwaysInsertFields) {
                // Build collections with adapter: null since plugin is disabled
                const collectionsWithoutAdapter = Object.entries(s3StorageOptions.collections).reduce((acc, [slug, collOptions])=>({
                        ...acc,
                        [slug]: {
                            ...collOptions === true ? {} : collOptions,
                            adapter: null
                        }
                    }), {});
                return cloudStoragePlugin({
                    alwaysInsertFields: true,
                    collections: collectionsWithoutAdapter,
                    enabled: false
                })(incomingConfig);
            }
            return incomingConfig;
        }
        const adapter = s3StorageInternal(getStorageClient, s3StorageOptions);
        // Add adapter to each collection option object
        const collectionsWithAdapter = Object.entries(s3StorageOptions.collections).reduce((acc, [slug, collOptions])=>({
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
            alwaysInsertFields: s3StorageOptions.alwaysInsertFields,
            collections: collectionsWithAdapter
        })(config);
    };
function s3StorageInternal(getStorageClient, { acl, bucket, clientUploads, collections, config = {}, signedDownloads: topLevelSignedDownloads }) {
    return ({ collection, prefix })=>{
        const collectionStorageConfig = collections[collection.slug];
        let signedDownloads = typeof collectionStorageConfig === 'object' ? collectionStorageConfig.signedDownloads ?? false : null;
        if (signedDownloads === null) {
            signedDownloads = topLevelSignedDownloads ?? null;
        }
        return {
            name: 's3',
            clientUploads,
            generateURL: getGenerateURL({
                bucket,
                config
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
                getStorageClient,
                signedDownloads: signedDownloads ?? false
            })
        };
    };
}

//# sourceMappingURL=index.js.map