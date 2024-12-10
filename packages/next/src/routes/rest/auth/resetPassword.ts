import httpStatus from 'http-status'
import { generatePayloadCookie, resetPasswordOperation } from 'payload'

import type { CollectionRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const resetPassword: CollectionRouteHandler = async ({ collection, req }) => {
  const { searchParams, t } = req
  const depth = searchParams.get('depth')

  const result = await resetPasswordOperation({
    collection,
    data: {
      password: typeof req.data?.password === 'string' ? req.data.password : '',
      token: typeof req.data?.token === 'string' ? req.data.token : '',
    },
    depth: depth ? Number(depth) : undefined,
    req,
  })

  const cookie = generatePayloadCookie({
    collectionAuthConfig: collection.config.auth,
    cookiePrefix: req.payload.config.cookiePrefix,
    token: result.token,
  })

  if (collection.config.auth.removeTokenFromResponses) {
    delete result.token
  }

  return Response.json(
    {
      message: t('authentication:passwordResetSuccessfully'),
      ...result,
    },
    {
      headers: headersWithCors({
        headers: new Headers({
          'Set-Cookie': cookie,
        }),
        req,
      }),
      status: httpStatus.OK,
    },
  )
}
