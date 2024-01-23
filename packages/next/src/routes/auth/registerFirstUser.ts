import httpStatus from 'http-status'
import { registerFirstUserOperation } from 'payload/operations'
import { PayloadRequest } from 'payload/types'
import { generatePayloadCookie } from '../../utilities/cookies'

export const registerFirstUser = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
  const result = await registerFirstUserOperation({
    collection: req.collection,
    data: {
      email: typeof req.data?.email === 'string' ? req.data.email : '',
      password: typeof req.data?.password === 'string' ? req.data.password : '',
    },
    req,
  })

  const cookie = generatePayloadCookie({
    token: result.token,
    payload: req.payload,
    collectionConfig: req.collection.config,
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
