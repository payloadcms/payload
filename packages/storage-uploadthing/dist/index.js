import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage';
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities';
import { UTApi } from 'uploadthing/server';
import { generateURL } from './generateURL.js';
import { getClientUploadRoute } from './getClientUploadRoute.js';
import { getHandleDelete } from './handleDelete.js';
import { getHandleUpload } from './handleUpload.js';
import { getHandler } from './staticHandler.js';
export const uploadthingStorage = (uploadthingStorageOptions)=>(incomingConfig)=>{
        const isPluginDisabled = uploadthingStorageOptions.enabled === false;
        initClientUploads({
            clientHandler: '@payloadcms/storage-uploadthing/client#UploadthingClientUploadHandler',
            collections: uploadthingStorageOptions.collections,
            config: incomingConfig,
            enabled: !isPluginDisabled && Boolean(uploadthingStorageOptions.clientUploads),
            serverHandler: getClientUploadRoute({
                access: typeof uploadthingStorageOptions.clientUploads === 'object' ? uploadthingStorageOptions.clientUploads.access : undefined,
                acl: uploadthingStorageOptions.options.acl || 'public-read',
                routerInputConfig: typeof uploadthingStorageOptions.clientUploads === 'object' ? uploadthingStorageOptions.clientUploads.routerInputConfig : undefined,
                token: uploadthingStorageOptions.options.token
            }),
            serverHandlerPath: '/storage-uploadthing-client-upload-route'
        });
        if (isPluginDisabled) {
            return incomingConfig;
        }
        // Default ACL to public-read
        if (!uploadthingStorageOptions.options.acl) {
            uploadthingStorageOptions.options.acl = 'public-read';
        }
        const adapter = uploadthingInternal(uploadthingStorageOptions);
        // Add adapter to each collection option object
        const collectionsWithAdapter = Object.entries(uploadthingStorageOptions.collections).reduce((acc, [slug, collOptions])=>({
                ...acc,
                [slug]: {
                    ...collOptions === true ? {} : collOptions,
                    // Disable payload access control if the ACL is public-read or not set
                    // ...(uploadthingStorageOptions.options.acl === 'public-read'
                    //   ? { disablePayloadAccessControl: true }
                    //   : {}),
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
            alwaysInsertFields: uploadthingStorageOptions.alwaysInsertFields,
            collections: collectionsWithAdapter
        })(config);
    };
function uploadthingInternal(options) {
    const fields = [
        {
            name: '_key',
            type: 'text',
            admin: {
                disableBulkEdit: true,
                disableListColumn: true,
                disableListFilter: true,
                hidden: true
            }
        }
    ];
    return ()=>{
        const { clientUploads, options: { acl = 'public-read', ...utOptions } } = options;
        const utApi = new UTApi(utOptions);
        return {
            name: 'uploadthing',
            clientUploads,
            fields,
            generateURL,
            handleDelete: getHandleDelete({
                utApi
            }),
            handleUpload: getHandleUpload({
                acl,
                utApi
            }),
            staticHandler: getHandler({
                utApi
            })
        };
    };
}

//# sourceMappingURL=index.js.map