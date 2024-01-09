import httpStatus from 'http-status'

import { PayloadRequest } from 'payload/types'
import { findByIDOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

// TODO(JARROD): pattern to catch errors and return correct Response
export const findByID = async ({
  req,
  id,
}: {
  req: PayloadRequest
  id: string
}): Promise<Response> => {
  const { searchParams } = new URL(req.url)
  const depth = searchParams.get('depth')

  try {
    const result = await findByIDOperation({
      id,
      collection: req.collection,
      depth: isNumber(depth) ? Number(depth) : undefined,
      draft: searchParams.get('draft') === 'true',
      req,
    })

    return Response.json(result, {
      status: httpStatus.OK,
    })
  } catch (error) {
    return Response.json(
      {
        message: req.t('error:notFound'),
      },
      {
        status: httpStatus.NOT_FOUND,
      },
    )
  }
}
