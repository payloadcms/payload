import httpStatus from 'http-status'

import type { Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../express/types'

import { APIError } from '../../errors'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'

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

  try {
    const shouldCommit = await initTransaction(req)

    const userDbArgs = {
      collection: collection.config.slug,
      req,
      where: {
        _verificationToken: { equals: token },
      },
    }
    let user: any
    if (collection.config?.db?.findOne) {
      user = await collection.config.db.findOne<any>(userDbArgs)
    } else {
      user = await req.payload.db.findOne<any>(userDbArgs)
    }

    if (!user) throw new APIError('Verification token is invalid.', httpStatus.BAD_REQUEST)
    if (user && user._verified === true)
      throw new APIError('This account has already been activated.', httpStatus.ACCEPTED)

    const updateDbArgs = {
      id: user.id,
      collection: collection.config.slug,
      data: {
        ...user,
        _verificationToken: null,
        _verified: true,
      },
      req,
    }

    if (collection.config?.db?.updateOne) {
      await collection.config.db.updateOne(updateDbArgs)
    } else {
      await req.payload.db.updateOne(updateDbArgs)
    }

    if (shouldCommit) await commitTransaction(req)

    return true
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default verifyEmail
