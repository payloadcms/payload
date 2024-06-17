import httpStatus from 'http-status'
import { generatePayloadCookie, registerFirstUserOperation } from 'payload'

import type { CollectionRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const registerFirstUser: CollectionRouteHandler = async ({ collection, req }) => {
  const { data, t } = req

  const result = await registerFirstUserOperation({
    collection,
    data: {
      ...data,
      email: typeof data?.email === 'string' ? data.email : '',
      password: typeof data?.password === 'string' ? data.password : '',
    },
    req,
  })

  const cookie = generatePayloadCookie({
    collectionConfig: collection.config,
    payload: req.payload,
    token: result.token,
  })

  return Response.json(
    {
      exp: result.exp,
      message: t('authentication:successfullyRegisteredFirstUser'),
      token: result.token,
      user: result.user,
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
