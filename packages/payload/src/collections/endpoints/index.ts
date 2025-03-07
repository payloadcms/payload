import type { Endpoint } from '../../config/types.js'

import { wrapInternalEndpoints } from '../../utilities/wrapInternalEndpoints.js'
import { countHandler } from './count.js'
import { createHandler } from './create.js'
import { deleteHandler } from './delete.js'
import { deleteByIDHandler } from './deleteByID.js'
import { docAccessHandler } from './docAccess.js'
import { duplicateHandler } from './duplicate.js'
import { findHandler } from './find.js'
import { findByIDHandler } from './findByID.js'
import { findVersionByIDHandler } from './findVersionByID.js'
import { findVersionsHandler } from './findVersions.js'
import { previewHandler } from './preview.js'
import { restoreVersionHandler } from './restoreVersion.js'
import { updateHandler } from './update.js'
import { updateByIDHandler } from './updateByID.js'

export const defaultCollectionEndpoints: Endpoint[] = [
  ...wrapInternalEndpoints([
    {
      handler: countHandler,
      method: 'get',
      path: '/count',
    },
    {
      handler: createHandler,
      method: 'post',
      path: '/',
    },
    {
      handler: deleteHandler,
      method: 'delete',
      path: '/',
    },
    {
      handler: deleteByIDHandler,
      method: 'delete',
      path: '/:id',
    },
    {
      handler: docAccessHandler,
      method: 'post',
      path: '/access/:id?',
    },
    {
      handler: findVersionsHandler,
      method: 'get',
      path: '/versions',
    },
    {
      handler: duplicateHandler,
      method: 'post',
      path: '/:id/duplicate',
    },
    {
      handler: findHandler,
      method: 'get',
      path: '/',
    },
    {
      handler: findByIDHandler,
      method: 'get',
      path: '/:id',
    },
    {
      handler: findVersionByIDHandler,
      method: 'get',
      path: '/versions/:id',
    },
    {
      handler: previewHandler,
      method: 'get',
      path: '/:id/preview',
    },
    {
      handler: restoreVersionHandler,
      method: 'post',
      path: '/versions/:id',
    },
    {
      handler: updateHandler,
      method: 'patch',
      path: '/',
    },
    {
      handler: updateByIDHandler,
      method: 'patch',
      path: '/:id',
    },
  ]),
]
