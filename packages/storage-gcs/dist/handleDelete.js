import path from 'path';
export const getHandleDelete = ({ bucket, getStorageClient })=>{
    return async ({ doc: { prefix = '' }, filename })=>{
        await getStorageClient().bucket(bucket).file(path.posix.join(prefix, filename)).delete({
            ignoreNotFound: true
        });
    };
};

//# sourceMappingURL=handleDelete.js.map