import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { unlockOperation } from '../operations/unlock.js'

export const unlockHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const { t } = req

  const authData =
    collection.config.auth?.loginWithUsername !== false
      ? {
          email: typeof req.data?.email === 'string' ? req.data.email : '',
          username: typeof req.data?.username === 'string' ? req.data.username : '',
        }
      : {
          email: typeof req.data?.email === 'string' ? req.data.email : '',
        }

  await unlockOperation({
    collection,
    data: authData,
    req,
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
