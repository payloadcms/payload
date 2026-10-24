import type { Collection } from '../../collections/config/types.js'
import type { AuthenticatedUser } from '../../index.js'
import type { Document, PayloadRequest } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utilities/buildAfterOperation.js'
import { buildBeforeOperation } from '../../collections/operations/utilities/buildBeforeOperation.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { assertNoValidationWrite } from '../../utilities/assertNoValidationWrite.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { httpStatus } from '../../utilities/httpStatus.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { applyUserReadAccess } from '../applyUserReadAccess.js'
import { getFieldsToSign } from '../getFieldsToSign.js'
import { jwtSign } from '../jwt.js'
import { redeemRefreshToken } from '../redeemRefreshToken.js'
import { extendSession } from '../sessions.js'

export type Result = {
  exp: number
  refreshedToken: string
  /** The next refresh token, when refreshing with a refresh token. */
  refreshToken?: string
  setCookie?: boolean
  user: Document
}

export type Arguments = {
  collection: Collection
  /**
   * A refresh token from login to refresh with, instead of the request's token. Unlike the
   * request's token, it still works after the token expired. Collection `refresh` hooks don't run
   * for it, since they replace refreshing with the request's token.
   */
  refreshToken?: string
  req: PayloadRequest
}

export const refreshOperation = async (incomingArgs: Arguments): Promise<Result> => {
  let args = incomingArgs

  assertNoValidationWrite(args.req)

  try {
    const shouldCommit = await initTransaction(args.req)

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'refresh',
      overrideAccess: false,
    })

    // /////////////////////////////////////
    // Refresh
    // /////////////////////////////////////

    const {
      collection: { config: collectionConfig },
      req,
      req: {
        payload: { config, secret },
      },
    } = args

    const refreshed = args.refreshToken
      ? await redeemRefreshToken({
          collection: collectionConfig.slug,
          refreshToken: args.refreshToken,
          req,
        })
      : undefined

    if (args.refreshToken && !refreshed) {
      // Commit, so a reused refresh token's session stays logged out
      if (shouldCommit) {
        await commitTransaction(req)
      }

      throw new Forbidden(args.req.t)
    }
    if (!refreshed) {
      if (!args.req.user) {
        throw new Forbidden(args.req.t)
      }
      if (args.req.user.collection !== collectionConfig.slug) {
        throw new APIError('Incorrect collection', httpStatus.FORBIDDEN)
      }
    }

    const pathname = new URL(args.req.url!).pathname

    const isGraphQL = pathname === config.routes.graphQL

    let user = await req.payload.db.findOne<AuthenticatedUser>({
      collection: collectionConfig.slug,
      req,
      where: { id: { equals: refreshed?.user.id ?? args.req.user!.id } },
    })

    if (!user) {
      throw new Forbidden(args.req.t)
    }

    const sid = args.req.user?._sid

    // redeemRefreshToken already refreshed the refresh token's session
    if (
      !refreshed &&
      collectionConfig.auth.useSessions &&
      !collectionConfig.auth.disableLocalStrategy
    ) {
      const session =
        sid && (await extendSession({ collectionConfig, payload: req.payload, req, sid, user }))

      if (!session) {
        throw new Forbidden(args.req.t)
      }
    }

    user = await req.payload.db.findOne({
      collection: collectionConfig.slug,
      locale: req.locale ?? undefined,
      req,
      where: appendNonTrashedFilter({
        enableTrash: Boolean(collectionConfig.trash),
        trash: false,
        where: { id: { equals: user.id } },
      }),
    })

    if (!user) {
      throw new NotFound(req.t)
    }

    user.collection = collectionConfig.slug
    user._strategy = refreshed ? 'local-jwt' : args.req.user!._strategy

    let result!: Result

    if (refreshed) {
      result = {
        exp: refreshed.exp,
        refreshedToken: refreshed.token,
        refreshToken: refreshed.refreshToken,
        setCookie: true,
        user,
      }
    } else {
      // /////////////////////////////////////
      // refresh hook - Collection
      // /////////////////////////////////////

      for (const refreshHook of args.collection.config.hooks.refresh) {
        const hookResult = await refreshHook({ args, user })

        if (hookResult) {
          result = hookResult
          break
        }
      }
    }

    if (!result) {
      const fieldsToSign = getFieldsToSign({
        collectionConfig,
        email: user?.email as string,
        sid,
        user: args.req.user,
      })

      const { exp, token: refreshedToken } = await jwtSign({
        fieldsToSign,
        secret,
        tokenExpiration: collectionConfig.auth.tokenExpiration,
      })

      result = {
        exp,
        refreshedToken,
        setCookie: true,
        user,
      }
    }

    result.user = await applyUserReadAccess({
      collection: collectionConfig,
      depth: isGraphQL ? 0 : collectionConfig.auth.depth,
      overrideAccess: false,
      req,
      showHiddenFields: false,
      user: result.user as AuthenticatedUser,
    })

    // /////////////////////////////////////
    // After Refresh - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterRefresh?.length) {
      for (const hook of collectionConfig.hooks.afterRefresh) {
        result =
          (await hook({
            collection: args.collection?.config,
            context: args.req.context,
            exp: result.exp,
            req: args.req,
            token: result.refreshedToken,
          })) || result
      }
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: args.collection?.config,
      operation: 'refresh',
      overrideAccess: false,
      result,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
