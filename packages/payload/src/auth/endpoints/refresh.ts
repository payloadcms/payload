import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { generatePayloadCookie } from '../cookies.js'
import { refreshOperation } from '../operations/refresh.js'

export const refreshHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const { t } = req

  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

  const result = await refreshOperation({
    collection,
    req,
  })

  const { refreshedToken, ...resultWithoutToken } = result

  if (result.setCookie) {
    const cookie = generatePayloadCookie({
      collectionAuthConfig: collection.config.auth,
      cookiePrefix: req.payload.config.cookiePrefix,
      token: refreshedToken,
    })

    headers.set('Set-Cookie', cookie)
  }

  const responseResult = collection.config.auth.removeTokenFromResponses
    ? resultWithoutToken
    : result

  return Response.json(
    {
      message: t('authentication:tokenRefreshSuccessful'),
      ...responseResult,
    },
    {
      headers,
      status: httpStatus.OK,
    },
  )
}
