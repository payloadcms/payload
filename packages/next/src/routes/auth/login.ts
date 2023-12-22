import httpStatus from 'http-status'
import { loginOperation } from 'payload/operations'
import { PayloadRequest } from 'payload/types'
import { isNumber } from 'payload/utilities'
import { generatePayloadCookie } from '../../utilities/cookies'

// TODO(JARROD): pattern to catch errors and return correct Response
export const login = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
  const { searchParams } = new URL(req.url)
  const depth = searchParams.get('depth')

  const result = await loginOperation({
    collection: req.collection,
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
    collectionConfig: req.collection.config,
  })

  return Response.json(
    {
      exp: result.exp,
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
