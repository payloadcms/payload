import path from 'path';
import { APIError, Forbidden } from 'payload';
const defaultAccess = ({ req })=>!!req.user;
export const getGenerateSignedURLHandler = ({ access = defaultAccess, bucket, collections, getStorageClient })=>{
    return async (req)=>{
        if (!req.json) {
            throw new APIError('Unreachable');
        }
        const { collectionSlug, filename, mimeType } = await req.json();
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
        const [url] = await getStorageClient().bucket(bucket).file(fileKey).getSignedUrl({
            action: 'write',
            contentType: mimeType,
            expires: Date.now() + 60 * 60 * 5,
            version: 'v4'
        });
        return Response.json({
            url
        });
    };
};

//# sourceMappingURL=generateSignedURL.js.map