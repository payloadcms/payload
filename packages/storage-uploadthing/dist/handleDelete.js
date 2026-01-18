import { APIError } from 'payload';
import { getKeyFromFilename } from './utilities.js';
export const getHandleDelete = ({ utApi })=>{
    return async ({ doc, filename, req })=>{
        const key = getKeyFromFilename(doc, filename);
        if (!key) {
            req.payload.logger.error({
                msg: `Error deleting file: ${filename} - unable to extract key from doc`
            });
            throw new APIError(`Error deleting file: ${filename}`);
        }
        try {
            if (key) {
                await utApi.deleteFiles(key);
            }
        } catch (err) {
            req.payload.logger.error({
                err,
                msg: `Error deleting file with key: ${filename} - key: ${key}`
            });
            throw new APIError(`Error deleting file: ${filename}`);
        }
    };
};

//# sourceMappingURL=handleDelete.js.map