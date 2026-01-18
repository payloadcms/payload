import { createClientFields } from '../../fields/config/client.js';
const serverOnlyCollectionProperties = [
    'hooks',
    'access',
    'endpoints',
    'custom',
    'joins',
    'polymorphicJoins',
    'flattenedFields',
    'indexes',
    'sanitizedIndexes'
];
const serverOnlyUploadProperties = [
    'adminThumbnail',
    'externalFileHeaderFilter',
    'handlers',
    'modifyResponseHeaders',
    'withMetadata'
];
const serverOnlyCollectionAdminProperties = [
    'hidden',
    'baseFilter',
    'baseListFilter',
    'components',
    'formatDocURL'
];
export const createClientCollectionConfig = ({ collection, defaultIDType, i18n, importMap })=>{
    const clientCollection = {};
    for(const key in collection){
        if (serverOnlyCollectionProperties.includes(key)) {
            continue;
        }
        switch(key){
            case 'admin':
                if (!collection.admin) {
                    break;
                }
                clientCollection.admin = {};
                for(const adminKey in collection.admin){
                    if (serverOnlyCollectionAdminProperties.includes(adminKey)) {
                        continue;
                    }
                    switch(adminKey){
                        case 'description':
                            if (typeof collection.admin.description === 'string' || typeof collection.admin.description === 'object') {
                                if (collection.admin.description) {
                                    clientCollection.admin.description = collection.admin.description;
                                }
                            } else if (typeof collection.admin.description === 'function') {
                                const description = collection.admin.description({
                                    t: i18n.t
                                });
                                if (description) {
                                    clientCollection.admin.description = description;
                                }
                            }
                            break;
                        case 'livePreview':
                            clientCollection.admin.livePreview = {};
                            if (collection.admin.livePreview?.breakpoints) {
                                clientCollection.admin.livePreview.breakpoints = collection.admin.livePreview.breakpoints;
                            }
                            break;
                        case 'preview':
                            if (collection.admin.preview) {
                                clientCollection.admin.preview = true;
                            }
                            break;
                        default:
                            ;
                            clientCollection.admin[adminKey] = collection.admin[adminKey];
                    }
                }
                break;
            case 'auth':
                if (!collection.auth) {
                    break;
                }
                clientCollection.auth = {};
                if (collection.auth.cookies) {
                    clientCollection.auth.cookies = collection.auth.cookies;
                }
                if (collection.auth.depth !== undefined) {
                    // Check for undefined as it can be a number (0)
                    clientCollection.auth.depth = collection.auth.depth;
                }
                if (collection.auth.disableLocalStrategy) {
                    clientCollection.auth.disableLocalStrategy = collection.auth.disableLocalStrategy;
                }
                if (collection.auth.lockTime !== undefined) {
                    // Check for undefined as it can be a number (0)
                    clientCollection.auth.lockTime = collection.auth.lockTime;
                }
                if (collection.auth.loginWithUsername) {
                    clientCollection.auth.loginWithUsername = collection.auth.loginWithUsername;
                }
                if (collection.auth.maxLoginAttempts !== undefined) {
                    // Check for undefined as it can be a number (0)
                    clientCollection.auth.maxLoginAttempts = collection.auth.maxLoginAttempts;
                }
                if (collection.auth.removeTokenFromResponses) {
                    clientCollection.auth.removeTokenFromResponses = collection.auth.removeTokenFromResponses;
                }
                if (collection.auth.useAPIKey) {
                    clientCollection.auth.useAPIKey = collection.auth.useAPIKey;
                }
                if (collection.auth.tokenExpiration) {
                    clientCollection.auth.tokenExpiration = collection.auth.tokenExpiration;
                }
                if (collection.auth.verify) {
                    clientCollection.auth.verify = true;
                }
                break;
            case 'fields':
                clientCollection.fields = createClientFields({
                    defaultIDType,
                    fields: collection.fields,
                    i18n,
                    importMap
                });
                break;
            case 'labels':
                clientCollection.labels = {
                    plural: typeof collection.labels.plural === 'function' ? collection.labels.plural({
                        i18n,
                        t: i18n.t
                    }) : collection.labels.plural,
                    singular: typeof collection.labels.singular === 'function' ? collection.labels.singular({
                        i18n,
                        t: i18n.t
                    }) : collection.labels.singular
                };
                break;
            case 'upload':
                if (!collection.upload) {
                    break;
                }
                clientCollection.upload = {};
                for(const uploadKey in collection.upload){
                    if (serverOnlyUploadProperties.includes(uploadKey)) {
                        continue;
                    }
                    if (uploadKey === 'imageSizes') {
                        clientCollection.upload.imageSizes = collection.upload.imageSizes?.map((size)=>{
                            const sanitizedSize = {
                                ...size
                            };
                            if ('generateImageName' in sanitizedSize) {
                                delete sanitizedSize.generateImageName;
                            }
                            return sanitizedSize;
                        });
                    } else {
                        ;
                        clientCollection.upload[uploadKey] = collection.upload[uploadKey];
                    }
                }
                break;
            default:
                ;
                clientCollection[key] = collection[key];
        }
    }
    return clientCollection;
};
export const createClientCollectionConfigs = ({ collections, defaultIDType, i18n, importMap })=>{
    const clientCollections = new Array(collections.length);
    for(let i = 0; i < collections.length; i++){
        const collection = collections[i];
        clientCollections[i] = createClientCollectionConfig({
            collection,
            defaultIDType,
            i18n,
            importMap
        });
    }
    return clientCollections;
};

//# sourceMappingURL=client.js.map