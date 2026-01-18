import * as AWS from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { APIError, Forbidden } from 'payload';
const bytesToMB = (bytes)=>{
    return bytes / 1024 / 1024;
};
const defaultAccess = ({ req })=>!!req.user;
export const getGenerateSignedURLHandler = ({ access = defaultAccess, acl, bucket, collections, getStorageClient })=>{
    return async (req)=>{
        if (!req.json) {
            throw new APIError('Content-Type expected to be application/json', 400);
        }
        let filesizeLimit = req.payload.config.upload.limits?.fileSize;
        if (filesizeLimit === Infinity) {
            filesizeLimit = undefined;
        }
        const { collectionSlug, filename, filesize, mimeType } = await req.json();
        const collectionS3Config = collections[collectionSlug];
        if (!collectionS3Config) {
            throw new APIError(`Collection ${collectionSlug} was not found in S3 options`);
        }
        const prefix = typeof collectionS3Config === 'object' && collectionS3Config.prefix || '';
        if (!await access({
            collectionSlug,
            req
        })) {
            throw new Forbidden();
        }
        const fileKey = path.posix.join(prefix, filename);
        const signableHeaders = new Set();
        if (filesizeLimit) {
            if (filesize > filesizeLimit) {
                throw new APIError(`Exceeded file size limit. Limit: ${bytesToMB(filesizeLimit).toFixed(2)}MB, got: ${bytesToMB(filesize).toFixed(2)}MB`, 400);
            }
            // Still force S3 to validate
            signableHeaders.add('content-length');
        }
        const url = await getSignedUrl(getStorageClient(), new AWS.PutObjectCommand({
            ACL: acl,
            Bucket: bucket,
            ContentLength: filesizeLimit ? Math.min(filesize, filesizeLimit) : undefined,
            ContentType: mimeType,
            Key: fileKey
        }), {
            expiresIn: 600,
            signableHeaders
        });
        return Response.json({
            url
        });
    };
};

//# sourceMappingURL=generateSignedURL.js.map