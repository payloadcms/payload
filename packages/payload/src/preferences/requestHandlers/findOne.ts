import httpStatus from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import findOne from '../operations/findOne.js'

export const findByIDHandler: PayloadHandler = async (req): Promise<Response> => {
  const result = await findOne({
    key: req.routeParams?.key as string,
    req,
    user: req.user,
  })

  return Response.json(
    {
      ...(result
        ? result
        : {
            message: req.t('general:notFound'),
            value: null,
          }),
    },
    {
      status: httpStatus.OK,
    },
  )
}
