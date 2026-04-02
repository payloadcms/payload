import type { Endpoint } from '../../config/types.js'

import { wrapInternalEndpoints } from '../../utilities/wrapInternalEndpoints.js'
import { getFileHandler } from './getFile.js'
import { getFileFromURLHandler } from './getFileFromURL.js'

export const uploadCollectionEndpoints: Endpoint[] = wrapInternalEndpoints([
  {
    handler: getFileFromURLHandler,
    method: 'get',
    path: '/paste-url/:id?',
  },
  {
    handler: getFileHandler,
    method: 'get',
    path: '/file/:filename',
  },
])
