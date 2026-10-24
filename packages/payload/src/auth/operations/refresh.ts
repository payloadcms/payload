import type { Collection, SanitizedCollectionConfig } from '../../collections/config/types.js'
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
   * request's token, it still works after the token expired.
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
        payload: { config },
      },
    } = args

    const refreshed = args.refreshToken
      ? await refreshWithRefreshToken({ args, refreshToken: args.refreshToken })
      : await refreshWithRequestToken({ args })

    if (!refreshed) {
      // A reused refresh token. Commit, so its session stays logged out
      if (shouldCommit) {
        await commitTransaction(req)
      }

      throw new Forbidden(req.t)
    }

    let result = refreshed

    const pathname = new URL(req.url!).pathname

    const isGraphQL = pathname === config.routes.graphQL

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

/** Refreshes the request's token. */
const refreshWithRequestToken = async ({ args }: { args: Arguments }): Promise<Result> => {
  const {
    collection: { config: collectionConfig },
    req,
  } = args

  if (!req.user) {
    throw new Forbidden(req.t)
  }
  if (req.user.collection !== collectionConfig.slug) {
    throw new APIError('Incorrect collection', httpStatus.FORBIDDEN)
  }

  const sessionUser = await req.payload.db.findOne<AuthenticatedUser>({
    collection: collectionConfig.slug,
    req,
    where: { id: { equals: req.user.id } },
  })

  if (!sessionUser) {
    throw new Forbidden(req.t)
  }

  const sid = req.user._sid

  if (collectionConfig.auth.useSessions && !collectionConfig.auth.disableLocalStrategy) {
    const session = sid && (await extendSession({ collectionConfig, req, sid, user: sessionUser }))

    if (!session) {
      throw new Forbidden(req.t)
    }
  }

  const user = await findUser({ id: sessionUser.id, collectionConfig, req })

  if (!user) {
    throw new NotFound(req.t)
  }

  user.collection = req.user.collection
  user._strategy = req.user._strategy

  const hookResult = await runRefreshHooks({ args, user })

  if (hookResult) {
    return hookResult
  }

  const { exp, token: refreshedToken } = await jwtSign({
    fieldsToSign: getFieldsToSign({
      collectionConfig,
      email: user.email as string,
      sid,
      user: req.user,
    }),
    secret: req.payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  return { exp, refreshedToken, setCookie: true, user }
}

/**
 * Refreshes the session of a refresh token, also after its token expired.
 *
 * @returns `null` when the refresh token is invalid, its session ended, or it was reused
 */
const refreshWithRefreshToken = async ({
  args,
  refreshToken,
}: {
  args: Arguments
  refreshToken: string
}): Promise<null | Result> => {
  const {
    collection: { config: collectionConfig },
    req,
  } = args

  const refreshed = await redeemRefreshToken({
    collection: collectionConfig.slug,
    refreshToken,
    req,
  })

  if (!refreshed) {
    return null
  }

  const user = await findUser({ id: refreshed.user.id, collectionConfig, req })

  if (!user) {
    throw new NotFound(req.t)
  }

  user.collection = collectionConfig.slug
  user._strategy = 'local-jwt'

  // The request now counts as the refresh token's user, like after a login
  req.user = user

  const hookResult = await runRefreshHooks({ args, user })

  if (hookResult) {
    // The hook replaces the token, and the session keeps its next refresh token
    return { ...hookResult, refreshToken: refreshed.refreshToken }
  }

  return {
    exp: refreshed.exp,
    refreshedToken: refreshed.token,
    refreshToken: refreshed.refreshToken,
    setCookie: true,
    user,
  }
}

/**
 * Runs the collection's `refresh` hooks, after the session was checked and extended. A hook that
 * returns a result replaces the token Payload would make.
 */
const runRefreshHooks = async ({
  args,
  user,
}: {
  args: Arguments
  user: AuthenticatedUser
}): Promise<Result | undefined> => {
  // /////////////////////////////////////
  // refresh hook - Collection
  // /////////////////////////////////////

  for (const refreshHook of args.collection.config.hooks.refresh) {
    const hookResult = await refreshHook({ args, user })

    if (hookResult) {
      return hookResult
    }
  }

  return undefined
}

/** The user to return, in the request's locale. Users in the trash can't refresh. */
const findUser = ({
  id,
  collectionConfig,
  req,
}: {
  collectionConfig: SanitizedCollectionConfig
  id: number | string
  req: PayloadRequest
}): Promise<AuthenticatedUser | null> =>
  req.payload.db.findOne<AuthenticatedUser>({
    collection: collectionConfig.slug,
    locale: req.locale ?? undefined,
    req,
    where: appendNonTrashedFilter({
      enableTrash: Boolean(collectionConfig.trash),
      trash: false,
      where: { id: { equals: id } },
    }),
  })
