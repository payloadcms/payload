import type { CookieOptions, Response } from 'express'

import jwt from 'jsonwebtoken'

import type { GeneratedTypes } from '../../'
import type { Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../express/types'
import type { User } from '../types'

import { buildAfterOperation } from '../../collections/operations/utils'
import { AuthenticationError, LockedAuth } from '../../errors'
import { afterRead } from '../../fields/hooks/afterRead'
import { commitTransaction } from '../../utilities/commitTransaction'
import getCookieExpiration from '../../utilities/getCookieExpiration'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields'
import isLocked from '../isLocked'
import { authenticateLocalStrategy } from '../strategies/local/authenticate'
import { incrementLoginAttempts } from '../strategies/local/incrementLoginAttempts'
import { getFieldsToSign } from './getFieldsToSign'
import unlock from './unlock'

export type Result = {
  exp?: number
  token?: string
  user?: User
}

export type Arguments = {
  collection: Collection
  data: {
    email: string
    password: string
  }
  depth?: number
  overrideAccess?: boolean
  req: PayloadRequest
  res?: Response
  showHiddenFields?: boolean
}

async function login<TSlug extends keyof GeneratedTypes['collections']>(
  incomingArgs: Arguments,
): Promise<Result & { user: GeneratedTypes['collections'][TSlug] }> {
  let args = incomingArgs

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
    await priorHook

    args =
      (await hook({
        args,
        collection: args.collection?.config,
        context: args.req.context,
        operation: 'login',
      })) || args
  }, Promise.resolve())

  const {
    collection: { config: collectionConfig },
    data,
    depth,
    overrideAccess,
    req,
    req: {
      payload,
      payload: { config, secret },
    },
    showHiddenFields,
  } = args

  try {
    const shouldCommit = await initTransaction(req)

    // /////////////////////////////////////
    // Login
    // /////////////////////////////////////

    const { email: unsanitizedEmail, password } = data

    if (typeof unsanitizedEmail !== 'string' || unsanitizedEmail.trim() === '') {
      throw new Error('The following field is invalid: email')
    }
    if (typeof password !== 'string' || password.trim() === '') {
      throw new Error('The following field is invalid: password')
    }

    const email = unsanitizedEmail ? unsanitizedEmail.toLowerCase().trim() : null

    let user = await payload.db.findOne<any>({
      collection: collectionConfig.slug,
      req,
      where: { email: { equals: email.toLowerCase() } },
    })

    if (!user || (args.collection.config.auth.verify && user._verified === false)) {
      throw new AuthenticationError(req.t)
    }

    if (user && isLocked(user.lockUntil)) {
      throw new LockedAuth(req.t)
    }

    const authResult = await authenticateLocalStrategy({ doc: user, password })

    user = sanitizeInternalFields(user)

    const maxLoginAttemptsEnabled = args.collection.config.auth.maxLoginAttempts > 0

    if (!authResult) {
      if (maxLoginAttemptsEnabled) {
        await incrementLoginAttempts({
          collection: collectionConfig,
          doc: user,
          payload: req.payload,
          req,
        })
      }

      throw new AuthenticationError(req.t)
    }

    if (maxLoginAttemptsEnabled) {
      await unlock({
        collection: {
          config: collectionConfig,
        },
        data,
        overrideAccess: true,
        req,
      })
    }

    const fieldsToSign = getFieldsToSign({
      collectionConfig,
      email,
      user,
    })

    await collectionConfig.hooks.beforeLogin.reduce(async (priorHook, hook) => {
      await priorHook

      user =
        (await hook({
          collection: args.collection?.config,
          context: args.req.context,
          req: args.req,
          user,
        })) || user
    }, Promise.resolve())

    const token = jwt.sign(fieldsToSign, secret, {
      expiresIn: collectionConfig.auth.tokenExpiration,
    })

    if (args.res) {
      const cookieOptions: CookieOptions = {
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

    req.user = user

    // /////////////////////////////////////
    // afterLogin - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterLogin.reduce(async (priorHook, hook) => {
      await priorHook

      user =
        (await hook({
          collection: args.collection?.config,
          context: args.req.context,
          req: args.req,
          token,
          user,
        })) || user
    }, Promise.resolve())

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    user = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth,
      doc: user,
      global: null,
      overrideAccess,
      req,
      showHiddenFields,
    })

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
      await priorHook

      user =
        (await hook({
          collection: args.collection?.config,
          context: req.context,
          doc: user,
          req,
        })) || user
    }, Promise.resolve())

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
      await priorHook

      user =
        (await hook({
          collection: args.collection?.config,
          context: req.context,
          doc: user,
          req,
        })) || user
    }, Promise.resolve())

    let result: Result & { user: GeneratedTypes['collections'][TSlug] } = {
      exp: (jwt.decode(token) as jwt.JwtPayload).exp,
      token,
      user,
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation<GeneratedTypes['collections'][TSlug]>({
      args,
      collection: args.collection?.config,
      operation: 'login',
      result,
    })

    if (collectionConfig.auth.removeTokenFromResponses) {
      delete result.token
    }

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default login
