import httpStatus from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import deleteOperation from '../operations/delete.js'

export const deleteHandler: PayloadHandler = async (req): Promise<Response> => {
  // We cannot import the addDataAndFileToRequest utility here from the 'next' package because of dependency issues
  // However that utility should be used where possible instead of manually appending the data
  let data

  try {
    data = await req.json()
  } catch (error) {
    data = {}
  }

  if (data) {
    req.data = data
    req.json = () => Promise.resolve(data)
  }

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
