import { del } from '@vercel/blob';
import path from 'path';
export const getHandleDelete = ({ baseUrl, token })=>{
    return async ({ doc: { prefix = '' }, filename })=>{
        const fileUrl = `${baseUrl}/${path.posix.join(prefix, filename)}`;
        const deletedBlob = await del(fileUrl, {
            token
        });
        return deletedBlob;
    };
};

//# sourceMappingURL=handleDelete.js.map