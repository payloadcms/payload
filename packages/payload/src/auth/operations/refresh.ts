import type { Collection } from '../../collections/config/types.js'
import type { Document, PayloadRequest } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utilities/buildAfterOperation.js'
import { buildBeforeOperation } from '../../collections/operations/utilities/buildBeforeOperation.js'
import { Forbidden } from '../../errors/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getFieldsToSign } from '../getFieldsToSign.js'
import { jwtSign } from '../jwt.js'
import { removeExpiredSessions } from '../sessions.js'

export type Result = {
  exp: number
  refreshedToken: string
  setCookie?: boolean
  /** @deprecated
   * use:
   * ```ts
   * user._strategy
   * ```
   */
  strategy?: string
  user: Document
}

export type Arguments = {
  collection: Collection
  req: PayloadRequest
}

export const refreshOperation = async (incomingArgs: Arguments): Promise<Result> => {
  let args = incomingArgs

  try {
    const shouldCommit = await initTransaction(args.req)

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'refresh',
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

    if (!args.req.user) {
      throw new Forbidden(args.req.t)
    }

    const pathname = new URL(args.req.url!).pathname

    const isGraphQL = pathname === config.routes.graphQL

    let user = await req.payload.db.findOne<any>({
      collection: collectionConfig.slug,
      req,
      where: { id: { equals: args.req.user.id } },
    })

    const sid = args.req.user._sid

    if (collectionConfig.auth.useSessions && !collectionConfig.auth.disableLocalStrategy) {
      if (!Array.isArray(user.sessions) || !sid) {
        throw new Forbidden(args.req.t)
      }

      const existingSession = user.sessions.find(({ id }: { id: number }) => id === sid)

      const now = new Date()
      const tokenExpInMs = collectionConfig.auth.tokenExpiration * 1000
      existingSession.expiresAt = new Date(now.getTime() + tokenExpInMs)

      // Prevent updatedAt from being updated when only refreshing a session
      user.updatedAt = null

      await req.payload.db.updateOne({
        id: user.id,
        collection: collectionConfig.slug,
        data: {
          ...user,
          sessions: removeExpiredSessions(user.sessions),
        },
        req,
        returning: false,
      })
    }

    user = await req.payload.findByID({
      id: user.id,
      collection: collectionConfig.slug,
      depth: isGraphQL ? 0 : args.collection.config.auth.depth,
      req: args.req,
    })

    if (user) {
      user.collection = args.req.user.collection
      user._strategy = args.req.user._strategy
    }

    let result!: Result

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

    if (!result) {
      const fieldsToSign = getFieldsToSign({
        collectionConfig,
        email: user?.email as string,
        sid,
        user: args?.req?.user,
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
        /** @deprecated
         * use:
         * ```ts
         * user._strategy
         * ```
         */
        strategy: args.req.user._strategy,
        user,
      }
    }

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
