import type { Endpoint } from '../../config/types.js'

import { wrapInternalEndpoints } from '../../utilities/wrapInternalEndpoints.js'
import { docAccessHandler } from './docAccess.js'
import { findOneHandler } from './findOne.js'
import { findVersionByIDHandler } from './findVersionByID.js'
import { findVersionsHandler } from './findVersions.js'
import { previewHandler } from './preview.js'
import { restoreVersionHandler } from './restoreVersion.js'
import { updateHandler } from './update.js'

export const defaultGlobalEndpoints: Endpoint[] = wrapInternalEndpoints([
  {
    handler: docAccessHandler,
    method: 'post',
    path: '/access',
  },
  {
    handler: findOneHandler,
    method: 'get',
    path: '/',
  },
  {
    handler: findVersionByIDHandler,
    method: 'get',
    path: '/versions/:id',
  },
  {
    handler: findVersionsHandler,
    method: 'get',
    path: '/versions',
  },
  {
    handler: previewHandler,
    method: 'get',
    path: '/preview',
  },
  {
    handler: restoreVersionHandler,
    method: 'post',
    path: '/versions/:id',
  },
  {
    handler: updateHandler,
    method: 'post',
    path: '/',
  },
])
