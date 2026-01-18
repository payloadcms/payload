import path from 'path';
import { getKeyFromFilename } from './utilities.js';
export const generateURL = ({ data, filename, prefix = '' })=>{
    const key = getKeyFromFilename(data, filename);
    return `https://utfs.io/f/${path.posix.join(prefix, key || '')}`;
};

//# sourceMappingURL=generateURL.js.map