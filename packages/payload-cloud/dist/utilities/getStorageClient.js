import { refreshSession } from './refreshSession.js';
export let storageClient = null;
export let session = null;
export let identityID;
export const getStorageClient = async ()=>{
    if (storageClient && session?.isValid()) {
        return {
            identityID,
            storageClient
        };
    }
    ;
    ({ identityID, session, storageClient } = await refreshSession());
    if (!process.env.PAYLOAD_CLOUD_PROJECT_ID) {
        throw new Error('PAYLOAD_CLOUD_PROJECT_ID is required');
    }
    if (!process.env.PAYLOAD_CLOUD_COGNITO_PASSWORD) {
        throw new Error('PAYLOAD_CLOUD_COGNITO_PASSWORD is required');
    }
    if (!process.env.PAYLOAD_CLOUD_COGNITO_IDENTITY_POOL_ID) {
        throw new Error('PAYLOAD_CLOUD_COGNITO_IDENTITY_POOL_ID is required');
    }
    return {
        identityID,
        storageClient
    };
};

//# sourceMappingURL=getStorageClient.js.map