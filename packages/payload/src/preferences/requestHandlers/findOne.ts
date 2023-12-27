import httpStatus from 'http-status'

import findOne from '../operations/findOne'

export const findByIDHandler = async ({ params, req }): Promise<Response> => {
  const result = await findOne({
    key: params.key,
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
