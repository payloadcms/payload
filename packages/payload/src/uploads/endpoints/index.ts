import type { Endpoint } from '../../config/types.js'

import { wrapInternalEndpoints } from '../../utilities/wrapInternalEndpoints.js'
import { getFileHandler } from './getFile.js'
import { pasteURLHandler } from './pasteURL.js'

export const uploadCollectionEndpoints: Endpoint[] = wrapInternalEndpoints([
  {
    handler: pasteURLHandler,
    method: 'get',
    path: '/paste-url/:id?',
  },
  {
    handler: getFileHandler,
    method: 'get',
    path: '/file/:filename',
  },
])
