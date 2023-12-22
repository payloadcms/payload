import httpStatus from 'http-status'

// import formatSuccessResponse from '../../express/responses/formatSuccess'
import deleteOperation from '../operations/delete'

export const deleteHandler = async ({ params, req }): Promise<Response> => {
  const result = await deleteOperation({
    key: params.key,
    req,
    user: req.user,
  })

  return Response.json(
    {
      ...result,
      // ...formatSuccessResponse(req.t('deletedSuccessfully'), 'message'),
    },
    {
      status: httpStatus.OK,
    },
  )
}
