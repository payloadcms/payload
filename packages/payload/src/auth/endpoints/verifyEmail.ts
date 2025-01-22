import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import verifyEmailOperation from '../operations/verifyEmail.js'

export const verifyEmailHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req, { disableSanitize: true })
  const { t } = req
  await verifyEmailOperation({
    collection,
    req,
    token: id,
  })

  return Response.json(
    {
      message: t('authentication:accountVerified'),
    },
    {
      status: httpStatus.OK,
    },
  )
}
