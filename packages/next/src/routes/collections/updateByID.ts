import httpStatus from 'http-status'

import type { PayloadRequest } from 'payload/types'

import { isNumber } from 'payload/utilities'
import { updateByID as updateByIdOperation } from 'payload/operations'

// TODO(JARROD): pattern to catch errors and return correct Response
export const updateByID = async ({
  req,
  id,
}: {
  req: PayloadRequest
  id: string
}): Promise<Response> => {
  const { searchParams } = new URL(req.url)
  const depth = searchParams.get('depth')
  const autosave = searchParams.get('autosave') === 'true'
  const draft = searchParams.get('draft') === 'true'

  const doc = await updateByIdOperation({
    id,
    autosave,
    collection: req.collection,
    data: req.data,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft,
    req,
  })

  let message = req.t('general:updatedSuccessfully')

  if (draft) message = req.t('version:draftSavedSuccessfully')
  if (autosave) message = req.t('version:autosavedSuccessfully')

  return Response.json(
    {
      // ...formatSuccessResponse(message, 'message'),
      doc,
    },
    {
      status: httpStatus.OK,
    },
  )
}
