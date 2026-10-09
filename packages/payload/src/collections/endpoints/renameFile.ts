import type { PayloadHandler } from '../../config/types.js'

import { APIError } from '../../errors/index.js'
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { httpStatus } from '../../utilities/httpStatus.js'
import { renameFileOperation } from '../operations/renameFile.js'

export const renameFileHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)
  const { draft, filename } = (req.data ?? {}) as { draft?: unknown; filename?: unknown }

  if (typeof filename !== 'string' || (draft !== undefined && typeof draft !== 'boolean')) {
    throw new APIError('Rename requires a filename and an optional boolean draft.', 400)
  }

  const doc = await renameFileOperation({ id, collection, draft, filename, req })

  return Response.json(
    { doc, message: req.t('general:updatedSuccessfully') },
    {
      headers: headersWithCors({ headers: new Headers(), req }),
      status: 200,
    },
  )
}
