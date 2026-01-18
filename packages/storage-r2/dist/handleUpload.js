import path from 'path';
export const getHandleUpload = ({ bucket, prefix = '' })=>{
    return async ({ data, file })=>{
        // Read more: https://github.com/cloudflare/workers-sdk/issues/6047#issuecomment-2691217843
        const buffer = process.env.NODE_ENV === 'development' ? new Blob([
            file.buffer
        ]) : file.buffer;
        await bucket.put(path.posix.join(data.prefix || prefix, file.filename), buffer, {
            httpMetadata: {
                contentType: file.mimeType
            }
        });
        return data;
    };
};

//# sourceMappingURL=handleUpload.js.map