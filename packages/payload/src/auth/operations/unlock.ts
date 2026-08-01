import { status as httpStatus } from 'http-status'
import { z } from 'zod'

import type {
  AuthOperationsFromCollectionSlug,
  Collection,
} from '../../collections/config/types.js'
import type { AuthCollectionSlug, Payload, RequestContext } from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest, Where } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utilities/buildAfterOperation.js'
import { buildBeforeOperation } from '../../collections/operations/utilities/buildBeforeOperation.js'
import { APIError } from '../../errors/index.js'
import { combineQueries, Forbidden } from '../../index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { authIdentifierSchema, collectionSchema } from '../../operations/schemaFields.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { executeAccess } from '../executeAccess.js'
import { getLoginOptions } from '../getLoginOptions.js'
import { resetLoginAttempts } from '../strategies/local/resetLoginAttempts.js'

export type UnlockArgs<TSlug extends AuthCollectionSlug> = {
  collection: Collection
  data: AuthOperationsFromCollectionSlug<TSlug>['unlock']
  overrideAccess?: boolean
  req: PayloadRequest
}

export const unlockUser = async <TSlug extends AuthCollectionSlug>(
  args: UnlockArgs<TSlug>,
): Promise<boolean> => {
  const {
    collection: { config: collectionConfig },
    overrideAccess,
    req: { locale },
    req,
  } = args

  const loginWithUsername = collectionConfig.auth.loginWithUsername

  const { canLoginWithEmail, canLoginWithUsername } = getLoginOptions(loginWithUsername)

  const sanitizedEmail = canLoginWithEmail && (args.data?.email || '').toLowerCase().trim()
  const sanitizedUsername =
    (canLoginWithUsername &&
      'username' in args.data &&
      typeof args.data.username === 'string' &&
      args.data.username.toLowerCase().trim()) ||
    null

  if (collectionConfig.auth.disableLocalStrategy) {
    throw new Forbidden(req.t)
  }
  if (!sanitizedEmail && !sanitizedUsername) {
    throw new APIError(
      `Missing ${collectionConfig.auth.loginWithUsername ? 'username' : 'email'}.`,
      httpStatus.BAD_REQUEST,
    )
  }

  try {
    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'unlock',
      overrideAccess,
    })

    const shouldCommit = await initTransaction(req)
    let whereConstraint: Where = {}

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    if (!overrideAccess) {
      const accessResult = await executeAccess({ req }, collectionConfig.access.unlock)

      if (accessResult && typeof accessResult === 'object') {
        whereConstraint = accessResult
      }
    }

    // /////////////////////////////////////
    // Unlock
    // /////////////////////////////////////

    if (canLoginWithEmail && sanitizedEmail) {
      whereConstraint = combineQueries(whereConstraint, {
        email: {
          equals: sanitizedEmail,
        },
      })
    } else if (canLoginWithUsername && sanitizedUsername) {
      whereConstraint = combineQueries(whereConstraint, {
        username: {
          equals: sanitizedUsername,
        },
      })
    }

    // Exclude trashed users unless `trash: true`
    whereConstraint = appendNonTrashedFilter({
      enableTrash: Boolean(collectionConfig.trash),
      trash: false,
      where: whereConstraint,
    })

    const user = await req.payload.db.findOne({
      collection: collectionConfig.slug,
      locale: locale!,
      req,
      where: whereConstraint,
    })

    let result: boolean | null = null

    if (user) {
      await resetLoginAttempts({
        collection: collectionConfig,
        doc: user,
        payload: req.payload,
        req,
      })
      result = true
    } else {
      result = null
      throw new Forbidden(req.t)
    }

    if (shouldCommit) {
      await commitTransaction(req)
    }

    result = await buildAfterOperation({
      args,
      collection: args.collection.config,
      operation: 'unlock',
      overrideAccess,
      result,
    })

    return Boolean(result)
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

type UnlockLocalMethod = <TSlug extends AuthCollectionSlug>(
  options: LocalAPIOptions<UnlockOptions<TSlug>>,
) => Promise<boolean>

const unlockSchema = z.looseObject({
  collection: collectionSchema,
  data: z.looseObject(authIdentifierSchema),
})

export const unlockLocalAPI = defineLocalAPI<UnlockLocalMethod>()({ name: 'unlock' })

export const unlock = defineOperation({
  action: 'unlock',
  expose: {
    local: unlockLocalAPI,
    mcp: { name: 'unlock' },
    rest: [
      {
        handler: async ({ invoke, req }) => {
          const collection = getRequestCollection(req)
          const authData =
            collection.config.auth?.loginWithUsername !== false
              ? {
                  email: typeof req.data?.email === 'string' ? req.data.email : '',
                  username: typeof req.data?.username === 'string' ? req.data.username : '',
                }
              : { email: typeof req.data?.email === 'string' ? req.data.email : '' }

          await invoke({
            context: req.payload,
            input: {
              collection: collection.config.slug,
              data: authData,
              overrideAccess: false,
              req,
            },
            validate: false,
          })

          return Response.json(
            { message: req.t('general:success') },
            {
              headers: headersWithCors({ headers: new Headers(), req }),
              status: httpStatus.OK,
            },
          )
        },
        method: 'post',
        path: '/unlock',
      },
    ],
  },
  handler: unlockHandler,
  input: unlockSchema,
  target: 'auth',
})

export type UnlockOptions<TSlug extends AuthCollectionSlug> = {
  collection: TSlug
  context?: RequestContext
  data: AuthOperationsFromCollectionSlug<TSlug>['unlock']
  overrideAccess: boolean
  req?: Partial<PayloadRequest>
}

async function unlockHandler<TSlug extends AuthCollectionSlug>(
  payload: Payload,
  options: UnlockOptions<TSlug>,
): Promise<boolean> {
  const { collection: collectionSlug, data, overrideAccess = true } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Unlock Operation.`,
    )
  }

  return unlockUser<TSlug>({
    collection,
    data,
    overrideAccess,
    req: await createLocalReq(options, payload),
  })
}
