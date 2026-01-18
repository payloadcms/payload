import { handleUpload } from '@vercel/blob/client';
import { APIError, Forbidden } from 'payload';
const defaultAccess = ({ req })=>!!req.user;
export const getClientUploadRoute = ({ access = defaultAccess, addRandomSuffix, cacheControlMaxAge, token })=>async (req)=>{
        const body = await req.json();
        try {
            const jsonResponse = await handleUpload({
                body,
                onBeforeGenerateToken: async (_pathname, collectionSlug)=>{
                    if (!collectionSlug) {
                        throw new APIError('No payload was provided');
                    }
                    if (!await access({
                        collectionSlug,
                        req
                    })) {
                        throw new Forbidden();
                    }
                    return Promise.resolve({
                        addRandomSuffix,
                        cacheControlMaxAge
                    });
                },
                onUploadCompleted: async ()=>{},
                request: req,
                token
            });
            return Response.json(jsonResponse);
        } catch (error) {
            req.payload.logger.error(error);
            throw new APIError('storage-vercel-blob client upload route error');
        }
    };

//# sourceMappingURL=getClientUploadRoute.js.map