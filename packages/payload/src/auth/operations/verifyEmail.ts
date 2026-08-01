import { status as httpStatus } from 'http-status'
import { z } from 'zod'

import type { Collection } from '../../collections/config/types.js'
import type { AuthCollectionSlug, Payload, RequestContext } from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest } from '../../types/index.js'

import { APIError, Forbidden } from '../../errors/index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { collectionSchema } from '../../operations/schemaFields.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'

export type VerifyEmailArgs = {
  collection: Collection
  req: PayloadRequest
  token: string
}

const verifyUserEmail = async (args: VerifyEmailArgs): Promise<boolean> => {
  const { collection, req, token } = args

  if (collection.config.auth.disableLocalStrategy) {
    throw new Forbidden(req.t)
  }
  if (!Object.prototype.hasOwnProperty.call(args, 'token')) {
    throw new APIError('Missing required data.', httpStatus.BAD_REQUEST)
  }

  try {
    const shouldCommit = await initTransaction(req)

    const where = appendNonTrashedFilter({
      enableTrash: Boolean(collection.config.trash),
      trash: false,
      where: {
        _verificationToken: { equals: token },
      },
    })

    const user = await req.payload.db.findOne<any>({
      collection: collection.config.slug,
      req,
      where,
    })

    if (!user) {
      throw new APIError('Verification token is invalid.', httpStatus.FORBIDDEN)
    }

    // Ensure updatedAt date is always updated
    user.updatedAt = new Date().toISOString()

    await req.payload.db.updateOne({
      id: user.id,
      collection: collection.config.slug,
      data: {
        ...user,
        _verificationToken: null,
        _verified: true,
      },
      req,
      returning: false,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return true
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

type VerifyEmailLocalMethod = <TSlug extends AuthCollectionSlug>(
  options: LocalAPIOptions<VerifyEmailOptions<TSlug>>,
) => Promise<boolean>

const verifyEmailSchema = z.looseObject({
  collection: collectionSchema,
  token: z.string(),
})

export const verifyEmailLocalAPI = defineLocalAPI<VerifyEmailLocalMethod>()({
  name: 'verifyEmail',
})

export const verifyEmail = defineOperation({
  action: 'verifyEmail',
  expose: {
    local: verifyEmailLocalAPI,
    mcp: { name: 'verify' },
    rest: [
      {
        handler: async ({ invoke, req }) => {
          const { id, collection } = getRequestCollectionWithID(req, { disableSanitize: true })

          await invoke({
            context: req.payload,
            input: {
              collection: collection.config.slug,
              req,
              token: id,
            },
            validate: false,
          })

          return Response.json(
            { message: req.t('authentication:accountVerified') },
            {
              headers: headersWithCors({ headers: new Headers(), req }),
              status: httpStatus.OK,
            },
          )
        },
        method: 'post',
        path: '/verify/:id',
      },
    ],
  },
  handler: verifyEmailHandler,
  input: verifyEmailSchema,
  target: 'auth',
})

export type VerifyEmailOptions<TSlug extends AuthCollectionSlug> = {
  collection: TSlug
  context?: RequestContext
  req?: Partial<PayloadRequest>
  token: string
}

async function verifyEmailHandler<T extends AuthCollectionSlug>(
  payload: Payload,
  options: VerifyEmailOptions<T>,
): Promise<boolean> {
  const { collection: collectionSlug, token } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Verify Email Operation.`,
    )
  }

  return verifyUserEmail({
    collection,
    req: await createLocalReq(options, payload),
    token,
  })
}
