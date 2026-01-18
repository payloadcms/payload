import { put } from '@vercel/blob';
import path from 'path';
export const getHandleUpload = ({ access = 'public', addRandomSuffix, baseUrl, cacheControlMaxAge, prefix = '', token })=>{
    return async ({ data, file: { buffer, filename, mimeType } })=>{
        const fileKey = path.posix.join(data.prefix || prefix, filename);
        const result = await put(fileKey, buffer, {
            access,
            addRandomSuffix,
            cacheControlMaxAge,
            contentType: mimeType,
            token
        });
        // Get filename with suffix from returned url
        if (addRandomSuffix) {
            data.filename = decodeURIComponent(result.url.replace(`${baseUrl}/`, ''));
        }
        return data;
    };
};

//# sourceMappingURL=handleUpload.js.map