import { AbortController } from '@azure/abort-controller';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
const multipartThreshold = 1024 * 1024 * 50 // 50MB
;
export const getHandleUpload = ({ getStorageClient, prefix = '' })=>{
    return async ({ data, file })=>{
        const fileKey = path.posix.join(data.prefix || prefix, file.filename);
        const blockBlobClient = getStorageClient().getBlockBlobClient(fileKey);
        // when there are no temp files, or the upload is less than the threshold size, do not stream files
        if (!file.tempFilePath && file.buffer.length > 0 && file.buffer.length < multipartThreshold) {
            await blockBlobClient.upload(file.buffer, file.buffer.byteLength, {
                blobHTTPHeaders: {
                    blobContentType: file.mimeType
                }
            });
            return data;
        }
        const fileBufferOrStream = file.tempFilePath ? fs.createReadStream(file.tempFilePath) : Readable.from(file.buffer);
        await blockBlobClient.uploadStream(fileBufferOrStream, 4 * 1024 * 1024, 4, {
            abortSignal: AbortController.timeout(30 * 60 * 1000)
        });
        return data;
    };
};

//# sourceMappingURL=handleUpload.js.map