import type {
  Collection,
  DataFromCollectionSlug,
  SanitizedCollectionConfig,
} from '../../collections/config/types.js'
import type { Validate } from '../../fields/config/types.js'
import type { AuthCollectionSlug, AuthenticatedUser } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utilities/buildAfterOperation.js'
import { buildBeforeOperation } from '../../collections/operations/utilities/buildBeforeOperation.js'
import { APIError, Forbidden, ValidationError } from '../../errors/index.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { assertNoValidationWrite } from '../../utilities/assertNoValidationWrite.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { httpStatus } from '../../utilities/httpStatus.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { applyUserReadAccess } from '../applyUserReadAccess.js'
import { createAuthToken } from '../createAuthToken.js'
import { revokeSession } from '../sessions.js'
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

export const resetPasswordOperation = async <TSlug extends AuthCollectionSlug>(
  args: Arguments,
): Promise<Result> => {
  const {
    collection: { config: collectionConfig },
    data,
    depth,
    overrideAccess = false,
    req: { payload },
    req,
  } = args

  assertNoValidationWrite(req)

  if (
    !Object.prototype.hasOwnProperty.call(data, 'token') ||
    !Object.prototype.hasOwnProperty.call(data, 'password')
  ) {
    throw new APIError('Missing required data.', httpStatus.BAD_REQUEST)
  }

  if (collectionConfig.auth.disableLocalStrategy) {
    throw new Forbidden(req.t)
  }

  let sid: string | undefined
  let sessionUser: AuthenticatedUser | null = null

  try {
    const shouldCommit = await initTransaction(req)

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'resetPassword',
      overrideAccess,
    })

    // /////////////////////////////////////
    // Reset Password
    // /////////////////////////////////////

    const where = appendNonTrashedFilter({
      enableTrash: Boolean(collectionConfig.trash),
      trash: false,
      where: {
        resetPasswordExpiration: { greater_than: new Date().toISOString() },
        resetPasswordToken: { equals: data.token },
      },
    })

    let user = await payload.db.findOne<AuthenticatedUser>({
      collection: collectionConfig.slug,
      req,
      where,
    })

    if (!user) {
      throw new APIError('Token is either invalid or has expired.', httpStatus.FORBIDDEN)
    }

    await validatePasswordField({
      collectionConfig,
      overrideAccess,
      password: data.password,
      req,
      user,
    })

    // TODO: replace this method
    const { hash, salt } = await generatePasswordSaltHash({
      collection: collectionConfig,
      password: data.password,
      req,
    })

    user.salt = salt
    user.hash = hash

    user.resetPasswordExpiration = new Date().toISOString()

    if (collectionConfig.auth.maxLoginAttempts > 0) {
      user.lockUntil = null
      user.loginAttempts = 0
    }

    if (collectionConfig.auth.verify) {
      user._verified = Boolean(user._verified)
    }

    // /////////////////////////////////////
    // beforeValidate - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.beforeValidate?.length) {
      for (const hook of collectionConfig.hooks.beforeValidate) {
        await hook({
          collection: args.collection?.config,
          context: req.context,
          data: user,
          operation: 'update',
          req,
        })
      }
    }

    // /////////////////////////////////////
    // Update new password
    // /////////////////////////////////////

    // Ensure updatedAt date is always updated
    user.updatedAt = new Date().toISOString()

    if (collectionConfig.auth.useSessions) {
      user.sessions = []
    }

    const doc = await payload.db.updateOne({
      id: user.id,
      collection: collectionConfig.slug,
      data: user,
      req,
    })

    await authenticateLocalStrategy({ doc, password: data.password })

    user = doc as AuthenticatedUser
    user.collection = collectionConfig.slug
    user._strategy = 'local-jwt'

    const { token, ...session } = await createAuthToken({
      collectionConfig,
      email: user.email!,
      req,
      user,
    })

    sessionUser = user
    sid = session.sid

    // /////////////////////////////////////
    // beforeLogin - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.beforeLogin?.length) {
      for (const hook of collectionConfig.hooks.beforeLogin) {
        user =
          (await hook({
            collection: args.collection?.config,
            context: args.req.context,
            req: args.req,
            user,
          })) || user
      }
    }

    req.user = user

    // /////////////////////////////////////
    // afterLogin - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterLogin?.length) {
      for (const hook of collectionConfig.hooks.afterLogin) {
        user =
          (await hook({
            collection: args.collection?.config,
            context: args.req.context,
            req: args.req,
            token,
            user,
          })) || user
      }
    }

    user!.collection = collectionConfig.slug
    user!._strategy = 'local-jwt'

    const userWithReadAccess = await applyUserReadAccess({
      collection: collectionConfig,
      depth: depth!,
      overrideAccess,
      req,
      showHiddenFields: false,
      user: user!,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    let result: { user: DataFromCollectionSlug<TSlug> } & Result = {
      token,
      user: userWithReadAccess,
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: args.collection?.config,
      operation: 'resetPassword',
      overrideAccess,
      result,
    })

    return result
  } catch (error: unknown) {
    // Logging in with the new password failed, e.g. in a `beforeLogin` hook, so remove the session
    // it started
    if (sid) {
      await revokeSession({
        collectionConfig,
        payload,
        req,
        sid,
        user: sessionUser,
      })
    }
    await killTransaction(req)
    throw error
  }
}

/**
 * Runs the `password` field override's validation, which `payload.db.updateOne` skips.
 */
async function validatePasswordField({
  collectionConfig,
  overrideAccess,
  password,
  req,
  user,
}: {
  collectionConfig: SanitizedCollectionConfig
  overrideAccess: boolean
  password: string
  req: PayloadRequest
  user: AuthenticatedUser
}): Promise<void> {
  const passwordField = collectionConfig.flattenedFields.find((field) => field.name === 'password')

  if (!passwordField || !('validate' in passwordField) || !passwordField.validate) {
    return
  }

  const validate = passwordField.validate as Validate<string>
  const dataToValidate = { ...user, password }

  const validationResult = await validate(password, {
    ...passwordField,
    id: user.id,
    blockData: {},
    collectionSlug: collectionConfig.slug,
    data: dataToValidate,
    event: 'submit',
    operation: 'update',
    overrideAccess,
    path: ['password'],
    preferences: { fields: {} },
    req,
    siblingData: dataToValidate,
  })

  if (typeof validationResult === 'string') {
    throw new ValidationError({
      collection: collectionConfig.slug,
      errors: [{ message: validationResult, path: 'password' }],
    })
  }
}
