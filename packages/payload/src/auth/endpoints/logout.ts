import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { generateExpiredPayloadCookie } from '../cookies.js'
import { logoutOperation } from '../operations/logout.js'

export const logoutHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const { t } = req
  const result = await logoutOperation({
    collection,
    req,
  })

  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

  if (!result) {
    return Response.json(
      {
        message: t('error:logoutFailed'),
      },
      {
        headers,
        status: httpStatus.BAD_REQUEST,
      },
    )
  }

  const expiredCookie = generateExpiredPayloadCookie({
    collectionAuthConfig: collection.config.auth,
    config: req.payload.config,
    cookiePrefix: req.payload.config.cookiePrefix,
  })

  headers.set('Set-Cookie', expiredCookie)

  return Response.json(
    {
      message: t('authentication:logoutSuccessful'),
    },
    {
      headers,
      status: httpStatus.OK,
    },
  )
}
