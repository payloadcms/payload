import type { PayloadHandler } from '../../config/types.js'
import type { Result } from '../operations/refresh.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { httpStatus } from '../../utilities/httpStatus.js'
import { generatePayloadCookie } from '../cookies.js'
import { refreshOperation } from '../operations/refresh.js'
import { refreshWithRefreshTokenOperation } from '../operations/refreshWithRefreshToken.js'

export const refreshHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const { t } = req

  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

  const refreshToken =
    typeof req.data?.refreshToken === 'string' ? req.data.refreshToken : undefined

  const result: { refreshToken?: string } & Result = refreshToken
    ? await refreshWithRefreshTokenOperation({ collection, refreshToken, req })
    : await refreshOperation({ collection, req })

  const { refreshedToken, refreshToken: _refreshToken, ...resultWithoutToken } = result

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
