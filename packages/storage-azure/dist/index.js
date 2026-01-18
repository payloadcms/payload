import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage';
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities';
import { getGenerateSignedURLHandler } from './generateSignedURL.js';
import { getGenerateURL } from './generateURL.js';
import { getHandleDelete } from './handleDelete.js';
import { getHandleUpload } from './handleUpload.js';
import { getHandler } from './staticHandler.js';
import { getStorageClient as getStorageClientFunc } from './utils/getStorageClient.js';
export const azureStorage = (azureStorageOptions)=>(incomingConfig)=>{
        const getStorageClient = ()=>getStorageClientFunc({
                connectionString: azureStorageOptions.connectionString,
                containerName: azureStorageOptions.containerName
            });
        const isPluginDisabled = azureStorageOptions.enabled === false;
        initClientUploads({
            clientHandler: '@payloadcms/storage-azure/client#AzureClientUploadHandler',
            collections: azureStorageOptions.collections,
            config: incomingConfig,
            enabled: !isPluginDisabled && Boolean(azureStorageOptions.clientUploads),
            serverHandler: getGenerateSignedURLHandler({
                access: typeof azureStorageOptions.clientUploads === 'object' ? azureStorageOptions.clientUploads.access : undefined,
                collections: azureStorageOptions.collections,
                containerName: azureStorageOptions.containerName,
                getStorageClient
            }),
            serverHandlerPath: '/storage-azure-generate-signed-url'
        });
        if (isPluginDisabled) {
            return incomingConfig;
        }
        const adapter = azureStorageInternal(getStorageClient, azureStorageOptions);
        // Add adapter to each collection option object
        const collectionsWithAdapter = Object.entries(azureStorageOptions.collections).reduce((acc, [slug, collOptions])=>({
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
            alwaysInsertFields: azureStorageOptions.alwaysInsertFields,
            collections: collectionsWithAdapter
        })(config);
    };
function azureStorageInternal(getStorageClient, { allowContainerCreate, baseURL, clientUploads, connectionString, containerName }) {
    const createContainerIfNotExists = ()=>{
        void getStorageClientFunc({
            connectionString,
            containerName
        }).createIfNotExists({
            access: 'blob'
        });
    };
    return ({ collection, prefix })=>{
        return {
            name: 'azure',
            clientUploads,
            generateURL: getGenerateURL({
                baseURL,
                containerName
            }),
            handleDelete: getHandleDelete({
                collection,
                getStorageClient
            }),
            handleUpload: getHandleUpload({
                collection,
                getStorageClient,
                prefix
            }),
            staticHandler: getHandler({
                collection,
                getStorageClient
            }),
            ...allowContainerCreate && {
                onInit: createContainerIfNotExists
            }
        };
    };
}
export { getStorageClientFunc as getStorageClient };

//# sourceMappingURL=index.js.map