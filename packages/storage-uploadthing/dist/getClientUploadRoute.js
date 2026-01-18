import { APIError, Forbidden } from 'payload';
const defaultAccess = ({ req })=>!!req.user;
import { createRouteHandler } from 'uploadthing/next';
import { createUploadthing } from 'uploadthing/server';
export const getClientUploadRoute = ({ access = defaultAccess, acl, routerInputConfig = {}, token })=>{
    const f = createUploadthing();
    const uploadRouter = {
        uploader: f({
            ...routerInputConfig,
            blob: {
                acl,
                maxFileCount: 1,
                maxFileSize: '512MB',
                ...'blob' in routerInputConfig ? routerInputConfig.blob : {}
            }
        }).middleware(async ({ req: rawReq })=>{
            const req = rawReq;
            const collectionSlug = req.searchParams.get('collectionSlug');
            if (!collectionSlug) {
                throw new APIError('No payload was provided');
            }
            if (!await access({
                collectionSlug,
                req
            })) {
                throw new Forbidden();
            }
            return {};
        }).onUploadComplete(()=>{})
    };
    const { POST } = createRouteHandler({
        config: {
            token
        },
        router: uploadRouter
    });
    return async (req)=>{
        return POST(req);
    };
};

//# sourceMappingURL=getClientUploadRoute.js.map