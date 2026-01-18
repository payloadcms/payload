'use client';
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client';
import { formatAdminURL } from 'payload/shared';
export const AzureClientUploadHandler = createClientUploadHandler({
    handler: async ({ apiRoute, collectionSlug, file, prefix, serverHandlerPath, serverURL })=>{
        const endpointRoute = formatAdminURL({
            apiRoute,
            path: serverHandlerPath,
            serverURL
        });
        const response = await fetch(endpointRoute, {
            body: JSON.stringify({
                collectionSlug,
                filename: file.name,
                mimeType: file.type
            }),
            credentials: 'include',
            method: 'POST'
        });
        const { url } = await response.json();
        await fetch(url, {
            body: file,
            headers: {
                'Content-Length': file.size.toString(),
                'Content-Type': file.type,
                // Required for azure
                'x-ms-blob-type': 'BlockBlob'
            },
            method: 'PUT'
        });
        return {
            prefix
        };
    }
});

//# sourceMappingURL=AzureClientUploadHandler.js.map