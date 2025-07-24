import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { forgotPasswordOperation } from '../operations/forgotPassword.js'

export const forgotPasswordHandler: PayloadHandler = async (req) => {
  const { searchParams, t } = req

  const collection = getRequestCollection(req)

  const trash = searchParams.get('trash') === 'true'

  const authData = collection.config.auth?.loginWithUsername
    ? {
        email: typeof req.data?.email === 'string' ? req.data.email : '',
        username: typeof req.data?.username === 'string' ? req.data.username : '',
      }
    : {
        email: typeof req.data?.email === 'string' ? req.data.email : '',
      }

  await forgotPasswordOperation({
    collection,
    data: authData,
    disableEmail: Boolean(req.data?.disableEmail),
    expiration: typeof req.data?.expiration === 'number' ? req.data.expiration : undefined,
    req,
    trash,
  })

  return Response.json(
    {
      message: t('general:success'),
    },
    {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
      status: httpStatus.OK,
    },
  )
}
