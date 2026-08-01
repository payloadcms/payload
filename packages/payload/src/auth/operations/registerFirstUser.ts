import { status as httpStatus } from 'http-status'
import { z } from 'zod'

import type {
  AuthOperationsFromCollectionSlug,
  Collection,
  DataFromCollectionSlug,
  RequiredDataFromCollectionSlug,
} from '../../collections/config/types.js'
import type { AuthCollectionSlug, Payload } from '../../index.js'
import type { PayloadRequest, SelectType } from '../../types/index.js'

import { Forbidden } from '../../errors/index.js'
import { defineOperation } from '../../operations/defineOperation.js'
import { collectionSchema, dataSchema, requestSchema } from '../../operations/schemaFields.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { generatePayloadCookie } from '../cookies.js'
import { ensureUsernameOrEmail } from '../ensureUsernameOrEmail.js'
import { getAuthCollection } from './getAuthCollection.js'

type RegisterFirstUserArgs<TSlug extends AuthCollectionSlug> = {
  collection: Collection
  data: AuthOperationsFromCollectionSlug<TSlug>['registerFirstUser'] &
    RequiredDataFromCollectionSlug<TSlug>
  req: PayloadRequest
}

export type Result<TData> = {
  exp?: number
  token?: string
  user?: TData
}

const registerInitialUser = async <TSlug extends AuthCollectionSlug>(
  args: RegisterFirstUserArgs<TSlug>,
): Promise<Result<DataFromCollectionSlug<TSlug>>> => {
  const {
    collection: {
      config,
      config: {
        slug,
        auth: { verify },
      },
    },
    data,
    req,
    req: { payload },
  } = args

  if (config.auth.disableLocalStrategy) {
    throw new Forbidden(req.t)
  }

  try {
    const shouldCommit = await initTransaction(req)

    ensureUsernameOrEmail<TSlug>({
      authOptions: config.auth,
      collectionSlug: slug,
      data,
      operation: 'create',
      req,
    })

    const where = appendNonTrashedFilter({
      enableTrash: Boolean(config.trash),
      trash: false,
      where: {}, // no initial filter; just exclude trashed docs
    })

    const doc = await payload.db.findOne({
      collection: config.slug,
      req,
      where,
    })

    if (doc) {
      throw new Forbidden(req.t)
    }

    // /////////////////////////////////////
    // Register first user
    // /////////////////////////////////////

    const result = await payload.create<TSlug, SelectType>({
      collection: slug as TSlug,
      data,
      overrideAccess: true,
      req,
    })

    // auto-verify (if applicable)
    if (verify) {
      await payload.update({
        id: result.id,
        collection: slug,
        data: {
          _verified: true,
        },
        req,
      })
    }

    // /////////////////////////////////////
    // Log in new user
    // /////////////////////////////////////

    const { exp, token } = await payload.login({
      ...args,
      collection: slug,
      req,
    })

    result.collection = slug
    result._strategy = 'local-jwt'

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return {
      exp,
      token,
      user: result,
    }
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

type RegisterFirstUserInput = {
  collection: AuthCollectionSlug
  data: AuthOperationsFromCollectionSlug<AuthCollectionSlug>['registerFirstUser'] &
    RequiredDataFromCollectionSlug<AuthCollectionSlug>
  req: PayloadRequest
}

const registerFirstUserSchema = z.looseObject({
  collection: collectionSchema,
  data: dataSchema,
  req: requestSchema,
})

export const registerFirstUser = defineOperation({
  action: 'registerFirstUser',
  expose: {
    rest: [
      {
        handler: async ({ invoke, req }) => {
          const collection = getRequestCollection(req)
          const authData = collection.config.auth?.loginWithUsername
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
              data: { ...req.data, ...authData },
              req,
            },
            validate: false,
          })
          const cookie = generatePayloadCookie({
            collectionAuthConfig: collection.config.auth,
            cookiePrefix: req.payload.config.cookiePrefix,
            token: result.token!,
          })

          return Response.json(
            {
              exp: result.exp,
              message: req.t('authentication:successfullyRegisteredFirstUser'),
              token: result.token,
              user: result.user,
            },
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
        path: '/first-register',
      },
    ],
  },
  handler: (payload: Payload, input: RegisterFirstUserInput) =>
    registerInitialUser({
      collection: getAuthCollection(payload, input.collection),
      data: input.data,
      req: input.req,
    }),
  input: registerFirstUserSchema,
  target: 'auth',
})
