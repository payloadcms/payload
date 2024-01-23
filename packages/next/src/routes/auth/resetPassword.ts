import httpStatus from 'http-status'

import { resetPasswordOperation } from 'payload/operations'
import { generatePayloadCookie } from '../../utilities/cookies'
import { PayloadRequest } from 'payload/types'

export const resetPassword = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
  const { searchParams } = new URL(req.url)
  const depth = searchParams.get('depth')

  const result = await resetPasswordOperation({
    collection: req.collection,
    data: {
      password: typeof req.data?.password === 'string' ? req.data.password : '',
      token: typeof req.data?.token === 'string' ? req.data.token : '',
    },
    depth: depth ? Number(depth) : undefined,
    req,
  })

  const cookie = generatePayloadCookie({
    token: result.token,
    payload: req.payload,
    collectionConfig: req.collection.config,
  })

  return Response.json(
    {
      // TODO(translate)
      message: 'Password reset successfully.',
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
