import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage';
import { getHandleDelete } from './handleDelete.js';
import { getHandleUpload } from './handleUpload.js';
import { getHandler } from './staticHandler.js';
export const r2Storage = (r2StorageOptions)=>(incomingConfig)=>{
        const adapter = r2StorageInternal(r2StorageOptions);
        const isPluginDisabled = r2StorageOptions.enabled === false;
        if (isPluginDisabled) {
            return incomingConfig;
        }
        // Add adapter to each collection option object
        const collectionsWithAdapter = Object.entries(r2StorageOptions.collections).reduce((acc, [slug, collOptions])=>({
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
            alwaysInsertFields: r2StorageOptions.alwaysInsertFields,
            collections: collectionsWithAdapter
        })(config);
    };
function r2StorageInternal({ bucket }) {
    return ({ collection, prefix })=>{
        return {
            name: 'r2',
            handleDelete: getHandleDelete({
                bucket
            }),
            handleUpload: getHandleUpload({
                bucket,
                collection,
                prefix
            }),
            staticHandler: getHandler({
                bucket,
                collection,
                prefix
            })
        };
    };
}

//# sourceMappingURL=index.js.map