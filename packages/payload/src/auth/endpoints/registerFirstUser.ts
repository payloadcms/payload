// @ts-strict-ignore
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { generatePayloadCookie } from '../cookies.js'
import { registerFirstUserOperation } from '../operations/registerFirstUser.js'

export const registerFirstUserHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const { data, t } = req
  const authData = collection.config.auth?.loginWithUsername
    ? {
        email: typeof req.data?.email === 'string' ? req.data.email : '',
        password: typeof req.data?.password === 'string' ? req.data.password : '',
        username: typeof req.data?.username === 'string' ? req.data.username : '',
      }
    : {
        email: typeof req.data?.email === 'string' ? req.data.email : '',
        password: typeof req.data?.password === 'string' ? req.data.password : '',
      }

  const result = await registerFirstUserOperation({
    collection,
    data: {
      ...data,
      ...authData,
    },
    req,
  })

  const cookie = generatePayloadCookie({
    collectionAuthConfig: collection.config.auth,
    cookiePrefix: req.payload.config.cookiePrefix,
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
