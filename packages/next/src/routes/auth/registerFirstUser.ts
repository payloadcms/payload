import httpStatus from 'http-status'
import { registerFirstUserOperation } from 'payload/operations'
import { generatePayloadCookie } from '../../utilities/cookies'
import { CollectionRouteHandler } from '../types'

export const registerFirstUser: CollectionRouteHandler = async ({ req, collection }) => {
  const result = await registerFirstUserOperation({
    collection,
    data: {
      email: typeof req.data?.email === 'string' ? req.data.email : '',
      password: typeof req.data?.password === 'string' ? req.data.password : '',
    },
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
      message: 'Successfully registered first user.',
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
