// @ts-strict-ignore
import { decodeJwt } from 'jose'

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { ClientUser, User } from '../types.js'

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
  user?: ClientUser
}

export type Arguments = {
  collection: Collection
  currentToken?: string
  req: PayloadRequest
}

export const meOperation = async (args: Arguments): Promise<MeOperationResult> => {
  const { collection, currentToken, req } = args

  let result: MeOperationResult = {
    user: null,
  }

  if (req.user) {
    const { pathname } = req
    const isGraphQL = pathname === `/api${req.payload.config.routes.graphQL}`

    const user = (await req.payload.findByID({
      id: req.user.id,
      collection: collection.config.slug,
      depth: isGraphQL ? 0 : collection.config.auth.depth,
      overrideAccess: false,
      req,
      showHiddenFields: false,
    })) as User

    if (user) {
      user.collection = collection.config.slug
      user._strategy = req.user._strategy
    }

    if (req.user.collection !== collection.config.slug) {
      return {
        user: null,
      }
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
