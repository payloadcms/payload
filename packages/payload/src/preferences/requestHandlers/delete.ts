import httpStatus from 'http-status'

import type { PayloadHandler } from '../../exports/config.d.ts'

import deleteOperation from '../operations/delete.js'

export const deleteHandler: PayloadHandler = async (req): Promise<Response> => {
  const result = await deleteOperation({
    key: req.routeParams?.key as string,
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
