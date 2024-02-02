import httpStatus from 'http-status'

import type { PayloadRequest } from 'payload/types'

import { isNumber } from 'payload/utilities'
import { updateByIDOperation } from 'payload/operations'

export const updateByID = async ({
  req,
  id,
}: {
  req: PayloadRequest
  id: string
}): Promise<Response> => {
  const { searchParams } = req
  const depth = searchParams.get('depth')
  const autosave = searchParams.get('autosave') === 'true'
  const draft = searchParams.get('draft') === 'true'

  try {
    const doc = await updateByIDOperation({
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
        message,
        doc,
      },
      {
        status: httpStatus.OK,
      },
    )
  } catch (error) {
    return Response.json(
      {
        message: error.message,
      },
      {
        status: error.status || httpStatus.INTERNAL_SERVER_ERROR,
      },
    )
  }
}
