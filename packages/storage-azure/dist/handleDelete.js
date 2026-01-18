import path from 'path';
export const getHandleDelete = ({ getStorageClient })=>{
    return async ({ doc: { prefix = '' }, filename })=>{
        const blockBlobClient = getStorageClient().getBlockBlobClient(path.posix.join(prefix, filename));
        await blockBlobClient.deleteIfExists();
    };
};

//# sourceMappingURL=handleDelete.js.map