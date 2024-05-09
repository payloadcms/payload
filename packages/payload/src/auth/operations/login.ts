import jwt from 'jsonwebtoken'

import type { Collection } from '../../collections/config/types.js'
import type { GeneratedTypes } from '../../index.js'
import type { PayloadRequestWithData } from '../../types/index.js'
import type { User } from '../types.js'

import { buildAfterOperation } from '../../collections/operations/utils.js'
import { AuthenticationError, LockedAuth, ValidationError } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields.js'
import { getFieldsToSign } from '../getFieldsToSign.js'
import isLocked from '../isLocked.js'
import { authenticateLocalStrategy } from '../strategies/local/authenticate.js'
import { incrementLoginAttempts } from '../strategies/local/incrementLoginAttempts.js'
import { resetLoginAttempts } from '../strategies/local/resetLoginAttempts.js'

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
  req: PayloadRequestWithData
  showHiddenFields?: boolean
}

export const loginOperation = async <TSlug extends keyof GeneratedTypes['collections']>(
  incomingArgs: Arguments,
): Promise<Result & { user: GeneratedTypes['collections'][TSlug] }> => {
  let args = incomingArgs

  try {
    const shouldCommit = await initTransaction(args.req)

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
          req: args.req,
        })) || args
    }, Promise.resolve())

    const {
      collection: { config: collectionConfig },
      data,
      depth,
      overrideAccess,
      req,
      req: {
        fallbackLocale,
        locale,
        payload,
        payload: { secret },
      },
      showHiddenFields,
    } = args

    // /////////////////////////////////////
    // Login
    // /////////////////////////////////////

    const { email: unsanitizedEmail, password } = data

    if (typeof unsanitizedEmail !== 'string' || unsanitizedEmail.trim() === '') {
      throw new ValidationError([{ field: 'email', message: req.i18n.t('validation:required') }])
    }
    if (typeof password !== 'string' || password.trim() === '') {
      throw new ValidationError([{ field: 'password', message: req.i18n.t('validation:required') }])
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

      if (shouldCommit) await commitTransaction(req)

      throw new AuthenticationError(req.t)
    }

    if (maxLoginAttemptsEnabled) {
      await resetLoginAttempts({
        collection: collectionConfig,
        doc: user,
        payload: req.payload,
        req,
      })
    }

    const fieldsToSign = getFieldsToSign({
      collectionConfig,
      email,
      user,
    })

    // /////////////////////////////////////
    // beforeLogin - Collection
    // /////////////////////////////////////

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
      draft: undefined,
      fallbackLocale,
      global: null,
      locale,
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

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
