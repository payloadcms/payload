import jwt from 'jsonwebtoken'

import type { Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../types'

import { APIError } from '../../errors'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import { getFieldsToSign } from '../getFieldsToSign'
import { authenticateLocalStrategy } from '../strategies/local/authenticate'
import { generatePasswordSaltHash } from '../strategies/local/generatePasswordSaltHash'

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
    throw new APIError('Missing required data.')
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

    const user = await payload.db.findOne<any>({
      collection: collectionConfig.slug,
      req,
      where: {
        resetPasswordExpiration: { greater_than: new Date() },
        resetPasswordToken: { equals: data.token },
      },
    })

    if (!user) throw new APIError('Token is either invalid or has expired.')

    // TODO: replace this method
    const { hash, salt } = await generatePasswordSaltHash({ password: data.password })

    user.salt = salt
    user.hash = hash

    user.resetPasswordExpiration = new Date().toISOString()

    if (collectionConfig.auth.verify) {
      user._verified = true
    }

    const doc = await payload.db.updateOne({
      id: user.id,
      collection: collectionConfig.slug,
      data: user,
      req,
    })

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
    if (shouldCommit) await commitTransaction(req)

    return {
      token: collectionConfig.auth.removeTokenFromResponses ? undefined : token,
      user: fullUser,
    }
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default resetPasswordOperation
