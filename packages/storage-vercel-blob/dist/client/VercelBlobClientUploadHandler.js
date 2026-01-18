'use client';
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client';
import { upload } from '@vercel/blob/client';
import { formatAdminURL } from 'payload/shared';
export const VercelBlobClientUploadHandler = createClientUploadHandler({
    handler: async ({ apiRoute, collectionSlug, extra: { addRandomSuffix, baseURL, prefix = '' }, file, serverHandlerPath, serverURL, updateFilename })=>{
        const endpointRoute = formatAdminURL({
            apiRoute,
            path: serverHandlerPath,
            serverURL
        });
        const result = await upload(`${prefix}${file.name}`, file, {
            access: 'public',
            clientPayload: collectionSlug,
            contentType: file.type,
            handleUploadUrl: endpointRoute
        });
        // Update filename with suffix from returned url
        if (addRandomSuffix) {
            updateFilename(result.url.replace(`${baseURL}/`, ''));
        }
        return {
            prefix
        };
    }
});

//# sourceMappingURL=VercelBlobClientUploadHandler.js.map