// @ts-strict-ignore
import url from 'url'

import type { Collection } from '../../collections/config/types.js'
import type { Document, PayloadRequest } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utils.js'
import { Forbidden } from '../../errors/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getFieldsToSign } from '../getFieldsToSign.js'
import { jwtSign } from '../jwt.js'

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

    if (args.collection.config.hooks?.beforeOperation?.length) {
      for (const hook of args.collection.config.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            collection: args.collection?.config,
            context: args.req.context,
            operation: 'refresh',
            req: args.req,
          })) || args
      }
    }

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

    const parsedURL = url.parse(args.req.url)
    const isGraphQL = parsedURL.pathname === config.routes.graphQL

    const user = await args.req.payload.findByID({
      id: args.req.user.id,
      collection: args.req.user.collection,
      depth: isGraphQL ? 0 : args.collection.config.auth.depth,
      req: args.req,
    })

    if (user) {
      user.collection = args.req.user.collection
      user._strategy = args.req.user._strategy
    }

    let result: Result

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
