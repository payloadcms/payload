import type { Response } from 'express'

import jwt from 'jsonwebtoken'

import type { Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../express/types'

import { APIError } from '../../errors'
import { commitTransaction } from '../../utilities/commitTransaction'
import getCookieExpiration from '../../utilities/getCookieExpiration'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import { authenticateLocalStrategy } from '../strategies/local/authenticate'
import { generatePasswordSaltHash } from '../strategies/local/generatePasswordSaltHash'
import { getFieldsToSign } from './getFieldsToSign'

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
  res?: Response
}

async function resetPassword(args: Arguments): Promise<Result> {
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
      payload: { config, secret },
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

    if (!user) throw new APIError('Token is either invalid or has expired.', 400)

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

    if (args.res) {
      const cookieOptions = {
        domain: undefined,
        expires: getCookieExpiration(collectionConfig.auth.tokenExpiration),
        httpOnly: true,
        path: '/',
        sameSite: collectionConfig.auth.cookies.sameSite,
        secure: collectionConfig.auth.cookies.secure,
      }

      if (collectionConfig.auth.cookies.domain)
        cookieOptions.domain = collectionConfig.auth.cookies.domain

      args.res.cookie(`${config.cookiePrefix}-token`, token, cookieOptions)
    }

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

export default resetPassword
