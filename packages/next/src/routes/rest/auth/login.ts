import httpStatus from 'http-status'
import { generatePayloadCookie } from 'payload/auth'
import { loginOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

import type { CollectionRouteHandler } from '../types'

export const login: CollectionRouteHandler = async ({ collection, req }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const result = await loginOperation({
    collection,
    data: {
      email: typeof req.data?.email === 'string' ? req.data.email : '',
      password: typeof req.data?.password === 'string' ? req.data.password : '',
    },
    depth: isNumber(depth) ? Number(depth) : undefined,
    req,
  })

  const cookie = generatePayloadCookie({
    collectionConfig: collection.config,
    payload: req.payload,
    token: result.token,
  })

  if (collection.config.auth.removeTokenFromResponses) {
    delete result.token
  }

  return Response.json(
    {
      // TODO(translate)
      message: 'Auth Passed',
      ...result,
    },
    {
      headers: new Headers({
        'Set-Cookie': cookie,
      }),
      status: httpStatus.OK,
    },
  )
}
