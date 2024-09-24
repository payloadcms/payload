import httpStatus from 'http-status'
import jwt from 'jsonwebtoken'

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { APIError } from '../../errors/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getFieldsToSign } from '../getFieldsToSign.js'
import { authenticateLocalStrategy } from '../strategies/local/authenticate.js'
import { generatePasswordSaltHash } from '../strategies/local/generatePasswordSaltHash.js'

export type Result = {
  token?: string
  user: Record<string, unknown>
}

export type Arguments = {
  collection: Collection
  data: {
    password: string
    token: string
  }
  depth?: number
  overrideAccess?: boolean
  req: PayloadRequest
}

export const resetPasswordOperation = async (args: Arguments): Promise<Result> => {
  if (
    !Object.prototype.hasOwnProperty.call(args.data, 'token') ||
    !Object.prototype.hasOwnProperty.call(args.data, 'password')
  ) {
    throw new APIError('Missing required data.', httpStatus.BAD_REQUEST)
  }

  const {
    collection: { config: collectionConfig },
    data,
    depth,
    overrideAccess,
    req: {
      payload: { secret },
      payload,
    },
    req,
  } = args

  try {
    const shouldCommit = await initTransaction(req)

    // /////////////////////////////////////
    // Reset Password
    // /////////////////////////////////////

    const userDbArgs = {
      collection: collectionConfig.slug,
      req,
      where: {
        resetPasswordExpiration: { greater_than: new Date().toISOString() },
        resetPasswordToken: { equals: data.token },
      },
    }

    let user: any
    // @ts-expect-error exists
    if (collectionConfig?.db?.findOne) {
      // @ts-expect-error exists
      user = await collectionConfig.db.findOne<any>(userDbArgs)
    } else {
      user = await payload.db.findOne<any>(userDbArgs)
    }

    if (!user) {
      throw new APIError('Token is either invalid or has expired.', httpStatus.FORBIDDEN)
    }

    // TODO: replace this method
    const { hash, salt } = await generatePasswordSaltHash({
      collection: collectionConfig,
      password: data.password,
      req,
    })

    user.salt = salt
    user.hash = hash

    user.resetPasswordExpiration = new Date().toISOString()

    if (collectionConfig.auth.verify) {
      user._verified = true
    }

    const updateDbArgs = {
      id: user.id,
      collection: collectionConfig.slug,
      data: user,
      req,
    }
    let doc: any
    // @ts-expect-error exists
    if (collectionConfig?.db?.updateOne) {
      // @ts-expect-error exists
      doc = await collectionConfig.db.updateOne(updateDbArgs)
    } else {
      doc = await payload.db.updateOne(updateDbArgs)
    }

    await authenticateLocalStrategy({ doc, password: data.password })

    const fieldsToSign = getFieldsToSign({
      collectionConfig,
      email: user.email,
      user,
    })

    const token = jwt.sign(fieldsToSign, secret, {
      expiresIn: collectionConfig.auth.tokenExpiration,
    })

    const fullUser = await payload.findByID({
      id: user.id,
      collection: collectionConfig.slug,
      depth,
      overrideAccess,
      req,
    })
    if (shouldCommit) {
      await commitTransaction(req)
    }

    const result = {
      token,
      user: fullUser,
    }

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
