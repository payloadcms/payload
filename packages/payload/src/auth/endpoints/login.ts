// @ts-strict-ignore
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { generatePayloadCookie } from '../cookies.js'
import { loginOperation } from '../operations/login.js'

export const loginHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const { searchParams, t } = req
  const depth = searchParams.get('depth')
  const authData =
    collection.config.auth?.loginWithUsername !== false
      ? {
          email: typeof req.data?.email === 'string' ? req.data.email : '',
          password: typeof req.data?.password === 'string' ? req.data.password : '',
          username: typeof req.data?.username === 'string' ? req.data.username : '',
        }
      : {
          email: typeof req.data?.email === 'string' ? req.data.email : '',
          password: typeof req.data?.password === 'string' ? req.data.password : '',
        }

  const result = await loginOperation({
    collection,
    data: authData,
    depth: isNumber(depth) ? Number(depth) : undefined,
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
      message: t('authentication:passed'),
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
