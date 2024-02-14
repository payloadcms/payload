import httpStatus from 'http-status'
import { loginOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'
import { generatePayloadCookie } from 'payload/auth'
import { CollectionRouteHandler } from '../types'

export const login: CollectionRouteHandler = async ({ req, collection }) => {
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
    token: result.token,
    payload: req.payload,
    collectionConfig: collection.config,
  })

  return Response.json(
    {
      exp: result.exp,
      // TODO(translate)
      message: 'Auth Passed',
      token: result.token,
      user: result.user,
    },
    {
      headers: new Headers({
        'Set-Cookie': cookie,
      }),
      status: httpStatus.OK,
    },
  )
}
