import httpStatus from 'http-status'

import deleteOperation from '../operations/delete'

export const deleteHandler = async ({ req, routeParams }): Promise<Response> => {
  const result = await deleteOperation({
    key: routeParams.key,
    req,
    user: req.user,
  })

  return Response.json(
    {
      ...result,
      message: req.t('general:deletedSuccessfully'),
    },
    {
      status: httpStatus.OK,
    },
  )
}
