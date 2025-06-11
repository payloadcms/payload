import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'

export const patchMeHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)

  if (!req.user) {
    return Response.json(
      {
        message: req.t('authentication:account'),
      },
      {
        headers: headersWithCors({
          headers: new Headers(),
          req,
        }),
        status: httpStatus.UNAUTHORIZED,
      },
    )
  }

  if (!req.data) {
    return Response.json(
      {
        message: req.t('error:missingRequiredData'),
      },
      {
        headers: headersWithCors({
          headers: new Headers(),
          req,
        }),
        status: httpStatus.BAD_REQUEST,
      },
    )
  }

  const updatedUser = await req.payload.update({
    id: req.user.id,
    collection: collection.config.slug,
    data: req.data,
    overrideAccess: false, // we don't want to override access here, as this is a user patching their own data
    req,
  })

  return Response.json(
    {
      ...updatedUser,
      message: req.t('general:success'),
    },
    {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
      status: httpStatus.OK,
    },
  )
}
