import { wrapInternalEndpoints } from '../../utilities/wrapInternalEndpoints.js';
import { getFileHandler } from './getFile.js';
import { getFileFromURLHandler } from './getFileFromURL.js';
export const uploadCollectionEndpoints = wrapInternalEndpoints([
    {
        handler: getFileFromURLHandler,
        method: 'get',
        path: '/paste-url/:id?'
    },
    {
        handler: getFileHandler,
        method: 'get',
        path: '/file/:filename'
    }
]);

//# sourceMappingURL=index.js.map