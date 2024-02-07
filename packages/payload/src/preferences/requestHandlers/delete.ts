import httpStatus from 'http-status'

import deleteOperation from '../operations/delete'

export const deleteHandler = async ({ req }): Promise<Response> => {
  const result = await deleteOperation({
    key: req.searchParams.get('key'),
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
