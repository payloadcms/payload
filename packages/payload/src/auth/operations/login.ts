import { status as httpStatus } from 'http-status'
import { z } from 'zod'

import type {
  AuthOperationsFromCollectionSlug,
  Collection,
  DataFromCollectionSlug,
} from '../../collections/config/types.js'
import type {
  AuthCollectionSlug,
  AuthenticatedUser,
  Payload,
  RequestContext,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { AuthRuntimeFields } from '../types.js'

import { buildAfterOperation } from '../../collections/operations/utilities/buildAfterOperation.js'
import { buildBeforeOperation } from '../../collections/operations/utilities/buildBeforeOperation.js'
import {
  APIError,
  AuthenticationError,
  LockedAuth,
  UnverifiedEmail,
  ValidationError,
} from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { commitTransaction, Forbidden, initTransaction } from '../../index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import {
  authIdentifierSchema,
  collectionSchema,
  depthSchema,
  fallbackLocaleSchema,
  localeSchema,
} from '../../operations/schemaFields.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeInternalFields } from '../../utilities/sanitizeInternalFields.js'
import { generatePayloadCookie } from '../cookies.js'
import { getFieldsToSign } from '../getFieldsToSign.js'
import { getLoginOptions } from '../getLoginOptions.js'
import { isUserLocked } from '../isUserLocked.js'
import { jwtSign } from '../jwt.js'
import { addSessionToUser, revokeSession } from '../sessions.js'
import { authenticateLocalStrategy } from '../strategies/local/authenticate.js'
import { incrementLoginAttempts } from '../strategies/local/incrementLoginAttempts.js'
import { resetLoginAttempts } from '../strategies/local/resetLoginAttempts.js'

export type LoginResult<TSlug extends AuthCollectionSlug> = {
  exp?: number
  token?: string
  user?: AuthRuntimeFields & DataFromCollectionSlug<TSlug>
}

type LoginLocalMethod = <TSlug extends AuthCollectionSlug>(
  options: LocalAPIOptions<LoginOptions<TSlug>>,
) => Promise<LoginResult<TSlug>>

const loginSchema = z.looseObject({
  collection: collectionSchema,
  data: z.looseObject({
    ...authIdentifierSchema,
    password: z.string().describe('The user password'),
  }),
  depth: depthSchema,
  fallbackLocale: fallbackLocaleSchema,
  locale: localeSchema,
  showHiddenFields: z.boolean().optional().default(false),
})

export const loginLocalAPI = defineLocalAPI<LoginLocalMethod>()({
  name: 'login',
  afterHandler: ({
    context: payload,
    input,
    result,
  }: {
    context: { collections: Record<string, Collection> }
    input: { collection: string }
    result: LoginResult<AuthCollectionSlug>
  }) => {
    if (payload.collections[input.collection]?.config.auth.removeTokenFromResponses) {
      delete result.token
    }

    return result
  },
})

export const login = defineOperation({
  action: 'login',
  expose: {
    local: loginLocalAPI,
    mcp: { name: 'login' },
    rest: [
      {
        handler: async ({ invoke, req }) => {
          const collection = getRequestCollection(req)
          const depth = req.searchParams.get('depth')
          const authData =
            collection.config.auth?.loginWithUsername !== false
              ? {
                  email: typeof req.data?.email === 'string' ? req.data.email : '',
                  password: typeof req.data?.password === 'string' ? req.data.password : '',
                  username: typeof req.data?.username === 'string' ? req.data.username : '',
                }
              : {
                  email: typeof req.data?.email === 'string' ? req.data.email : '',
                  password: typeof req.data?.password === 'string' ? req.data.password : '',
                }
          const result = await invoke({
            context: req.payload,
            input: {
              collection: collection.config.slug,
              data: authData,
              depth: isNumber(depth) ? Number(depth) : undefined,
              overrideAccess: false,
              req,
            },
            validate: false,
          })
          const cookie = generatePayloadCookie({
            collectionAuthConfig: collection.config.auth,
            cookiePrefix: req.payload.config.cookiePrefix,
            token: result.token!,
          })

          if (collection.config.auth.removeTokenFromResponses) {
            delete result.token
          }

          return Response.json(
            { message: req.t('authentication:passed'), ...result },
            {
              headers: headersWithCors({
                headers: new Headers({ 'Set-Cookie': cookie }),
                req,
              }),
              status: httpStatus.OK,
            },
          )
        },
        method: 'post',
        path: '/login',
      },
    ],
  },
  handler: loginHandler,
  input: loginSchema,
  target: 'auth',
})

export type LoginArgs<TSlug extends AuthCollectionSlug> = {
  collection: Collection
  data: AuthOperationsFromCollectionSlug<TSlug>['login']
  depth?: number
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
}

type CheckLoginPermissionArgs<TSlug extends AuthCollectionSlug> = {
  loggingInWithUsername?: boolean
  req: PayloadRequest
  user: DataFromCollectionSlug<TSlug>
}

/**
 * Throws an error if the user is locked or does not exist.
 * This does not check the login attempts, only the lock status. Whoever increments login attempts
 * is responsible for locking the user properly, not whoever checks the login permission.
 */
export const checkLoginPermission = <TSlug extends AuthCollectionSlug>({
  loggingInWithUsername,
  req,
  user,
}: CheckLoginPermissionArgs<TSlug>) => {
  if (!user) {
    throw new AuthenticationError(req.t, Boolean(loggingInWithUsername))
  }

  if (isUserLocked(new Date(user.lockUntil))) {
    throw new LockedAuth(req.t)
  }
}

export const logInUser = async <TSlug extends AuthCollectionSlug>(
  incomingArgs: LoginArgs<TSlug>,
): Promise<LoginResult<TSlug>> => {
  let args = incomingArgs

  if (args.collection.config.auth.disableLocalStrategy) {
    throw new Forbidden(args.req.t)
  }

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  args = await buildBeforeOperation({
    args,
    collection: args.collection.config,
    operation: 'login',
    overrideAccess: args.overrideAccess!,
  })

  const {
    collection: { config: collectionConfig },
    data,
    depth,
    overrideAccess = false,
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
  const loginWithUsername = collectionConfig.auth.loginWithUsername

  const sanitizedEmail =
    typeof unsanitizedEmail === 'string' ? unsanitizedEmail.toLowerCase().trim() : null
  const sanitizedUsername =
    'username' in data && typeof data?.username === 'string'
      ? data.username.toLowerCase().trim()
      : null

  const { canLoginWithEmail, canLoginWithUsername } = getLoginOptions(loginWithUsername)

  // cannot login with email, did not provide username
  if (!canLoginWithEmail && !sanitizedUsername) {
    throw new ValidationError({
      collection: collectionConfig.slug,
      errors: [{ message: req.i18n.t('validation:required'), path: 'username' }],
    })
  }

  // cannot login with username, did not provide email
  if (!canLoginWithUsername && !sanitizedEmail) {
    throw new ValidationError({
      collection: collectionConfig.slug,
      errors: [{ message: req.i18n.t('validation:required'), path: 'email' }],
    })
  }

  // can login with either email or username, did not provide either
  if (!sanitizedUsername && !sanitizedEmail) {
    throw new ValidationError({
      collection: collectionConfig.slug,
      errors: [
        { message: req.i18n.t('validation:required'), path: 'email' },
        { message: req.i18n.t('validation:required'), path: 'username' },
      ],
    })
  }

  // did not provide password for login
  if (typeof password !== 'string' || password.trim() === '') {
    throw new ValidationError({
      collection: collectionConfig.slug,
      errors: [{ message: req.i18n.t('validation:required'), path: 'password' }],
    })
  }

  let whereConstraint: Where = {}
  const emailConstraint: Where = {
    email: {
      equals: sanitizedEmail,
    },
  }
  const usernameConstraint: Where = {
    username: {
      equals: sanitizedUsername,
    },
  }

  if (canLoginWithEmail && canLoginWithUsername && (sanitizedUsername || sanitizedEmail)) {
    if (sanitizedUsername) {
      whereConstraint = {
        or: [
          usernameConstraint,
          {
            email: {
              equals: sanitizedUsername,
            },
          },
        ],
      }
    } else {
      whereConstraint = {
        or: [
          emailConstraint,
          {
            username: {
              equals: sanitizedEmail,
            },
          },
        ],
      }
    }
  } else if (canLoginWithEmail && sanitizedEmail) {
    whereConstraint = emailConstraint
  } else if (canLoginWithUsername && sanitizedUsername) {
    whereConstraint = usernameConstraint
  }

  // Exclude trashed users
  whereConstraint = appendNonTrashedFilter({
    enableTrash: collectionConfig.trash,
    trash: false,
    where: whereConstraint,
  })

  let user = (await payload.db.findOne<User>({
    collection: collectionConfig.slug,
    req,
    where: whereConstraint,
  })) as AuthenticatedUser

  checkLoginPermission({
    loggingInWithUsername: Boolean(canLoginWithUsername && sanitizedUsername),
    req,
    user,
  })

  user.collection = collectionConfig.slug
  user._strategy = 'local-jwt'

  const authResult = await authenticateLocalStrategy({ doc: user, password })
  user = sanitizeInternalFields(user)

  const maxLoginAttemptsEnabled = args.collection.config.auth.maxLoginAttempts > 0

  if (!authResult) {
    if (maxLoginAttemptsEnabled) {
      await incrementLoginAttempts({
        collection: collectionConfig,
        payload: req.payload,
        user,
      })

      // Re-check login permissions and max attempts after incrementing attempts, in case parallel updates occurred
      checkLoginPermission({
        loggingInWithUsername: Boolean(canLoginWithUsername && sanitizedUsername),
        req,
        user,
      })
    }

    throw new AuthenticationError(req.t)
  }

  if (collectionConfig.auth.verify && user._verified === false) {
    throw new UnverifiedEmail({ t: req.t })
  }

  // Authentication successful - start transaction for remaining operations
  const shouldCommit = await initTransaction(args.req)
  let sid: string | undefined

  try {
    /*
     * Correct password accepted - re‑check that the account didn't
     * get locked by parallel bad attempts in the meantime.
     */
    if (maxLoginAttemptsEnabled) {
      const { lockUntil, loginAttempts } = (await payload.db.findOne<User>({
        collection: collectionConfig.slug,
        req,
        select: {
          lockUntil: true,
          loginAttempts: true,
        },
        where: { id: { equals: user.id } },
      }))!

      user.lockUntil = lockUntil
      user.loginAttempts = loginAttempts

      checkLoginPermission({
        req,
        user,
      })
    }

    const fieldsToSignArgs: Parameters<typeof getFieldsToSign>[0] = {
      collectionConfig,
      email: sanitizedEmail!,
      user,
    }

    const session = await addSessionToUser({
      collectionConfig,
      payload,
      req,
      user,
    })
    sid = session.sid

    if (sid) {
      fieldsToSignArgs.sid = sid
    }

    const fieldsToSign = getFieldsToSign(fieldsToSignArgs)

    if (maxLoginAttemptsEnabled) {
      await resetLoginAttempts({
        collection: collectionConfig,
        doc: user,
        payload: req.payload,
        req,
      })
    }

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

    const { exp, token } = await jwtSign({
      fieldsToSign,
      secret,
      tokenExpiration: collectionConfig.auth.tokenExpiration,
    })

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

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    user = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth: depth!,
      doc: user,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      draft: undefined,
      fallbackLocale: fallbackLocale!,
      global: null,
      locale: locale!,
      overrideAccess,
      req,
      showHiddenFields: showHiddenFields!,
    })

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterRead?.length) {
      for (const hook of collectionConfig.hooks.afterRead) {
        user =
          (await hook({
            collection: args.collection?.config,
            context: req.context,
            doc: user,
            overrideAccess,
            req,
          })) || user
      }
    }

    let result: LoginResult<TSlug> = {
      exp,
      token,
      user,
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: args.collection?.config,
      operation: 'login',
      overrideAccess: args.overrideAccess!,
      result,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return result
  } catch (error: unknown) {
    if (sid) {
      await revokeSession({
        collectionConfig,
        payload,
        req,
        sid,
        user,
      })
    }
    await killTransaction(args.req)
    throw error
  }
}

export type LoginOptions<TSlug extends AuthCollectionSlug> = {
  collection: TSlug
  context?: RequestContext
  data: AuthOperationsFromCollectionSlug<TSlug>['login']
  depth?: number
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  req?: Partial<PayloadRequest>
  showHiddenFields?: boolean
  trash?: boolean
}

async function loginHandler<TSlug extends AuthCollectionSlug>(
  payload: Payload,
  options: LoginOptions<TSlug>,
): Promise<LoginResult<TSlug>> {
  const {
    collection: collectionSlug,
    data,
    depth,
    overrideAccess = true,
    showHiddenFields,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Login Operation.`,
    )
  }

  const args = {
    collection,
    data,
    depth,
    overrideAccess,
    req: await createLocalReq(options, payload),
    showHiddenFields,
  }

  const result = await logInUser<TSlug>(args)

  return result
}
