import httpStatus from 'http-status'

import type { Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../express/types'

import { APIError } from '../../errors'

export type Args = {
  collection: Collection
  req: PayloadRequest
  token: string
}

async function verifyEmail(args: Args): Promise<boolean> {
  const { collection, req, token } = args
  if (!Object.prototype.hasOwnProperty.call(args, 'token')) {
    throw new APIError('Missing required data.', httpStatus.BAD_REQUEST)
  }

  const user = await req.payload.db.findOne<any>({
    collection: collection.config.slug,
    req,
    where: {
      _verificationToken: { equals: token },
    },
  })

  if (!user) throw new APIError('Verification token is invalid.', httpStatus.BAD_REQUEST)
  if (user && user._verified === true)
    throw new APIError('This account has already been activated.', httpStatus.ACCEPTED)

  await req.payload.db.updateOne({
    id: user.id,
    collection: collection.config.slug,
    data: {
      _verificationToken: null,
      _verified: true,
    },
    req,
  })

  return true
}

export default verifyEmail
