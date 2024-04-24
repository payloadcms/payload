import httpStatus from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import findOne from '../operations/findOne.js'

export const findByIDHandler: PayloadHandler = async (req): Promise<Response> => {
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
