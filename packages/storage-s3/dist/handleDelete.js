import path from 'path';
export const getHandleDelete = ({ bucket, getStorageClient })=>{
    return async ({ doc: { prefix = '' }, filename })=>{
        await getStorageClient().deleteObject({
            Bucket: bucket,
            Key: path.posix.join(prefix, filename)
        });
    };
};

//# sourceMappingURL=handleDelete.js.map