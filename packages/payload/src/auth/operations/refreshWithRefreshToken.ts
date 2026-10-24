import type { Collection } from '../../collections/config/types.js'
import type { AuthenticatedUser } from '../../index.js'
import type { Document, PayloadRequest } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utilities/buildAfterOperation.js'
import { buildBeforeOperation } from '../../collections/operations/utilities/buildBeforeOperation.js'
import { Forbidden, NotFound } from '../../errors/index.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { assertNoValidationWrite } from '../../utilities/assertNoValidationWrite.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { applyUserReadAccess } from '../applyUserReadAccess.js'
import { redeemRefreshToken } from '../redeemRefreshToken.js'

export type Result = {
  exp: number
  refreshedToken: string
  /** The next refresh token. The one that was passed in is used up. */
  refreshToken: string
  setCookie?: boolean
  user: Document
}

export type Arguments = {
  collection: Collection
  /** A refresh token from login or an earlier refresh. */
  refreshToken: string
  req: PayloadRequest
}

/**
 * Trades a refresh token for a new token and a new refresh token. Unlike the refresh operation,
 * which refreshes the request's token, this also works after the token expired.
 */
export const refreshWithRefreshTokenOperation = async (
  incomingArgs: Arguments,
): Promise<Result> => {
  let args = incomingArgs

  assertNoValidationWrite(args.req)

  try {
    const shouldCommit = await initTransaction(args.req)

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    // Typed with the refresh operation's arguments, which don't have the refresh token
    args = (await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'refresh',
      overrideAccess: false,
    })) as Arguments

    // /////////////////////////////////////
    // Refresh
    // /////////////////////////////////////

    const {
      collection: { config: collectionConfig },
      refreshToken,
      req,
    } = args

    const refreshed = await redeemRefreshToken({
      collection: collectionConfig.slug,
      refreshToken,
      req,
    })

    if (!refreshed) {
      // Commit, so a reused refresh token's session stays logged out
      if (shouldCommit) {
        await commitTransaction(req)
      }

      throw new Forbidden(req.t)
    }

    const isGraphQL = new URL(req.url!).pathname === req.payload.config.routes.graphQL

    const user = await req.payload.db.findOne<AuthenticatedUser>({
      collection: collectionConfig.slug,
      locale: req.locale ?? undefined,
      req,
      where: appendNonTrashedFilter({
        enableTrash: Boolean(collectionConfig.trash),
        trash: false,
        where: { id: { equals: refreshed.user.id } },
      }),
    })

    if (!user) {
      throw new NotFound(req.t)
    }

    user.collection = collectionConfig.slug
    user._strategy = 'local-jwt'

    // The request now counts as the refresh token's user, like after a login
    req.user = user

    let result: Result = {
      exp: refreshed.exp,
      refreshedToken: refreshed.token,
      refreshToken: refreshed.refreshToken,
      setCookie: true,
      user: await applyUserReadAccess({
        collection: collectionConfig,
        depth: isGraphQL ? 0 : collectionConfig.auth.depth,
        overrideAccess: false,
        req,
        showHiddenFields: false,
        user,
      }),
    }

    // /////////////////////////////////////
    // After Refresh - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterRefresh?.length) {
      for (const hook of collectionConfig.hooks.afterRefresh) {
        result =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            exp: result.exp,
            req,
            token: result.refreshedToken,
          })) || result
      }
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
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
