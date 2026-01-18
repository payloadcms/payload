import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
const multipartThreshold = 1024 * 1024 * 50 // 50MB
;
export const getHandleUpload = ({ acl, bucket, getStorageClient, prefix = '' })=>{
    return async ({ data, file })=>{
        const fileKey = path.posix.join(data.prefix || prefix, file.filename);
        const fileBufferOrStream = file.tempFilePath ? fs.createReadStream(file.tempFilePath) : file.buffer;
        if (file.buffer.length > 0 && file.buffer.length < multipartThreshold) {
            await getStorageClient().putObject({
                ACL: acl,
                Body: fileBufferOrStream,
                Bucket: bucket,
                ContentType: file.mimeType,
                Key: fileKey
            });
            return data;
        }
        const parallelUploadS3 = new Upload({
            client: getStorageClient(),
            params: {
                ACL: acl,
                Body: fileBufferOrStream,
                Bucket: bucket,
                ContentType: file.mimeType,
                Key: fileKey
            },
            partSize: multipartThreshold,
            queueSize: 4
        });
        await parallelUploadS3.done();
        return data;
    };
};

//# sourceMappingURL=handleUpload.js.map