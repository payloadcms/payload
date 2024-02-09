import httpStatus from 'http-status'

import type { PayloadHandler } from '../../exports/config'

import findOne from '../operations/findOne'

export const findByIDHandler: PayloadHandler = async ({ req, routeParams }): Promise<Response> => {
  const result = await findOne({
    key: routeParams.key,
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
