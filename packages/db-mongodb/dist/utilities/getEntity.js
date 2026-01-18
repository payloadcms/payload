import { APIError } from 'payload';
export const getCollection = ({ adapter, collectionSlug, versions = false })=>{
    const collection = adapter.payload.collections[collectionSlug];
    if (!collection) {
        throw new APIError(`ERROR: Failed to retrieve collection with the slug "${collectionSlug}". Does not exist.`);
    }
    if (versions) {
        const Model = adapter.versions[collectionSlug];
        if (!Model) {
            throw new APIError(`ERROR: Failed to retrieve collection version model with the slug "${collectionSlug}". Does not exist.`);
        }
        return {
            collectionConfig: collection.config,
            customIDType: collection.customIDType,
            Model
        };
    }
    const Model = adapter.collections[collectionSlug];
    if (!Model) {
        throw new APIError(`ERROR: Failed to retrieve collection model with the slug "${collectionSlug}". Does not exist.`);
    }
    return {
        collectionConfig: collection.config,
        customIDType: collection.customIDType,
        Model
    };
};
export const getGlobal = ({ adapter, globalSlug, versions = false })=>{
    const globalConfig = adapter.payload.config.globals.find((each)=>each.slug === globalSlug);
    if (!globalConfig) {
        throw new APIError(`ERROR: Failed to retrieve global with the slug "${globalSlug}". Does not exist.`);
    }
    if (versions) {
        const Model = adapter.versions[globalSlug];
        if (!Model) {
            throw new APIError(`ERROR: Failed to retrieve global version model with the slug "${globalSlug}". Does not exist.`);
        }
        return {
            globalConfig,
            Model
        };
    }
    return {
        globalConfig,
        Model: adapter.globals
    };
};

//# sourceMappingURL=getEntity.js.map