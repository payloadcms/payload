import path from 'path';
export const getHandleUpload = ({ acl, bucket, getStorageClient, prefix = '' })=>{
    return async ({ data, file })=>{
        const fileKey = path.posix.join(data.prefix || prefix, file.filename);
        const gcsFile = getStorageClient().bucket(bucket).file(fileKey);
        await gcsFile.save(file.buffer, {
            metadata: {
                contentType: file.mimeType
            }
        });
        if (acl) {
            await gcsFile[`make${acl}`]();
        }
        return data;
    };
};

//# sourceMappingURL=handleUpload.js.map