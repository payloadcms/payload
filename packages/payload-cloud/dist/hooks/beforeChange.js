import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import { createKey } from '../utilities/createKey.js';
import { getIncomingFiles } from '../utilities/getIncomingFiles.js';
import { getStorageClient } from '../utilities/getStorageClient.js';
const MB = 1024 * 1024;
export const getBeforeChangeHook = ({ collection })=>async ({ data, req })=>{
        try {
            const files = getIncomingFiles({
                data,
                req
            });
            req.payload.logger.debug({
                msg: `Preparing to upload ${files.length} files`
            });
            const { identityID, storageClient } = await getStorageClient();
            const promises = files.map(async (file)=>{
                const fileKey = file.filename;
                req.payload.logger.debug({
                    fileKey,
                    msg: `File buffer length: ${file.buffer.length / MB}MB`,
                    tempFilePath: file.tempFilePath ?? 'undefined'
                });
                const fileBufferOrStream = file.tempFilePath ? fs.createReadStream(file.tempFilePath) : file.buffer;
                if (file.buffer.length > 0) {
                    req.payload.logger.debug({
                        fileKey,
                        msg: `Uploading ${fileKey} from buffer. Size: ${file.buffer.length / MB}MB`
                    });
                    await storageClient.putObject({
                        Body: fileBufferOrStream,
                        Bucket: process.env.PAYLOAD_CLOUD_BUCKET,
                        ContentType: file.mimeType,
                        Key: createKey({
                            collection: collection.slug,
                            filename: fileKey,
                            identityID
                        })
                    });
                }
                // This will buffer at max 4 * 5MB = 20MB. Default queueSize is 4 and default partSize is 5MB.
                const parallelUploadS3 = new Upload({
                    client: storageClient,
                    params: {
                        Body: fileBufferOrStream,
                        Bucket: process.env.PAYLOAD_CLOUD_BUCKET,
                        ContentType: file.mimeType,
                        Key: createKey({
                            collection: collection.slug,
                            filename: fileKey,
                            identityID
                        })
                    }
                });
                parallelUploadS3.on('httpUploadProgress', (progress)=>{
                    if (progress.total) {
                        req.payload.logger.debug({
                            fileKey,
                            msg: `Uploaded part ${progress.part} - ${(progress.loaded || 0) / MB}MB out of ${(progress.total || 0) / MB}MB`
                        });
                    }
                });
                await parallelUploadS3.done();
            });
            await Promise.all(promises);
        } catch (err) {
            req.payload.logger.error(`There was an error while uploading files corresponding to the collection ${collection.slug} with filename ${data.filename}:`);
            req.payload.logger.error(err);
        }
        return data;
    };

//# sourceMappingURL=beforeChange.js.map