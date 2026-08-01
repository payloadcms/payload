import { status as httpStatus } from 'http-status'
import { decodeJwt } from 'jose'
import { z } from 'zod'

import type { Collection } from '../../collections/config/types.js'
import type { AuthenticatedUser, Payload } from '../../index.js'
import type { JoinQuery, PayloadRequest, PopulateType, SelectType } from '../../types/index.js'
import type { JoinParams } from '../../utilities/sanitizeJoinParams.js'

import { defineOperation } from '../../operations/defineOperation.js'
import {
  collectionSchema,
  depthSchema,
  populateSchema,
  requestSchema,
  selectSchema,
} from '../../operations/schemaFields.js'
import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { sanitizeJoinParams } from '../../utilities/sanitizeJoinParams.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { extractJWT } from '../extractJWT.js'
import { getAuthCollection } from './getAuthCollection.js'
export type MeOperationResult = {
  collection?: string
  exp?: number
  /** @deprecated
   * use:
   * ```ts
   * user._strategy
   * ```
   */
  strategy?: string
  token?: string
  user?: AuthenticatedUser | null
}

export type MeArgs = {
  collection: Collection
  currentToken?: string
  depth?: number
  draft?: boolean
  joins?: JoinQuery
  populate?: PopulateType
  req: PayloadRequest
  select?: SelectType
}

const getCurrentUser = async (args: MeArgs): Promise<MeOperationResult> => {
  const { collection, currentToken, depth, draft, joins, populate, req, select } = args

  let result: MeOperationResult = {
    user: null!,
  }

  if (req.user) {
    if (req.user.collection !== collection.config.slug) {
      return {
        user: null!,
      }
    }

    const { pathname } = req
    const isGraphQL = pathname === `/api${req.payload.config.routes.graphQL}`

    const user = (await req.payload.findByID({
      id: req.user.id,
      collection: collection.config.slug,
      depth: isGraphQL ? 0 : (depth ?? collection.config.auth.depth),
      draft,
      joins,
      overrideAccess: false,
      populate,
      req,
      select,
      showHiddenFields: false,
    })) as AuthenticatedUser

    if (user) {
      user.collection = collection.config.slug
      user._strategy = req.user._strategy
    }

    // /////////////////////////////////////
    // me hook - Collection
    // /////////////////////////////////////

    for (const meHook of collection.config.hooks.me) {
      const hookResult = await meHook({ args, user })

      if (hookResult) {
        result.user = hookResult.user
        result.exp = hookResult.exp

        break
      }
    }

    result.collection = req.user.collection
    /** @deprecated
     * use:
     * ```ts
     * user._strategy
     * ```
     */
    result.strategy = req.user._strategy

    if (!result.user) {
      result.user = user

      if (currentToken) {
        const decoded = decodeJwt(currentToken)
        if (decoded) {
          result.exp = decoded.exp
        }
        if (!collection.config.auth.removeTokenFromResponses) {
          result.token = currentToken
        }
      }
    }
  }

  // /////////////////////////////////////
  // After Me - Collection
  // /////////////////////////////////////

  if (collection.config.hooks?.afterMe?.length) {
    for (const hook of collection.config.hooks.afterMe) {
      result =
        (await hook({
          collection: collection?.config,
          context: req.context,
          req,
          response: result,
        })) || result
    }
  }

  return result
}

const meSchema = z.looseObject({
  collection: collectionSchema,
  currentToken: z.string().optional(),
  depth: depthSchema,
  draft: z.boolean().optional(),
  joins: z.union([z.record(z.string(), z.unknown()), z.literal(false)]).optional(),
  populate: populateSchema,
  req: requestSchema,
  select: selectSchema,
})

export const me = defineOperation({
  action: 'me',
  expose: {
    rest: [
      {
        handler: async ({ invoke, req }) => {
          const collection = getRequestCollection(req)
          const depthFromSearchParams = req.searchParams.get('depth')
          const draftFromSearchParams = req.searchParams.get('depth')
          const {
            depth: depthFromQuery,
            draft: draftFromQuery,
            joins,
            populate,
            select,
          } = req.query as {
            depth?: string
            draft?: string
            joins?: JoinParams
            populate?: Record<string, unknown>
            select?: Record<string, unknown>
          }
          const depth = depthFromQuery || depthFromSearchParams
          const draft = draftFromQuery || draftFromSearchParams
          const result = await invoke({
            context: req.payload,
            input: {
              collection: collection.config.slug,
              currentToken: extractJWT(req) ?? undefined,
              depth: isNumber(depth) ? Number(depth) : undefined,
              draft: draft === 'true',
              joins: sanitizeJoinParams(joins),
              populate: sanitizePopulateParam(populate),
              req,
              select: sanitizeSelectParam(select),
            },
            validate: false,
          })

          if (collection.config.auth.removeTokenFromResponses) {
            delete result.token
          }

          return Response.json(
            { ...result, message: req.t('authentication:account') },
            {
              headers: headersWithCors({ headers: new Headers(), req }),
              status: httpStatus.OK,
            },
          )
        },
        method: 'get',
        path: '/me',
      },
    ],
  },
  handler: (payload: Payload, input: { collection: string } & Omit<MeArgs, 'collection'>) =>
    getCurrentUser({ ...input, collection: getAuthCollection(payload, input.collection) }),
  input: meSchema,
  target: 'auth',
})
