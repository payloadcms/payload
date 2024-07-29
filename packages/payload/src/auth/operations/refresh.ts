import type { Response } from 'express'

import jwt from 'jsonwebtoken'
import url from 'url'

import type { BeforeOperationHook, Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../express/types'
import type { Document } from '../../types'

import { buildAfterOperation } from '../../collections/operations/utils'
import { Forbidden } from '../../errors'
import { commitTransaction } from '../../utilities/commitTransaction'
import getCookieExpiration from '../../utilities/getCookieExpiration'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import { getFieldsToSign } from './getFieldsToSign'

export type Result = {
  exp: number
  refreshedToken: string
  strategy?: string
  user: Document
}

export type Arguments = {
  collection: Collection
  req: PayloadRequest
  res?: Response
}

async function refresh(incomingArgs: Arguments): Promise<Result> {
  let args = incomingArgs

  try {
    const shouldCommit = await initTransaction(args.req)

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    await args.collection.config.hooks.beforeOperation.reduce(
      async (priorHook: BeforeOperationHook | Promise<void>, hook: BeforeOperationHook) => {
        await priorHook

        args =
          (await hook({
            args,
            collection: args.collection?.config,
            context: args.req.context,
            operation: 'refresh',
            req: args.req,
          })) || args
      },
      Promise.resolve(),
    )

    // /////////////////////////////////////
    // Refresh
    // /////////////////////////////////////

    const {
      collection: { config: collectionConfig },
      req: {
        payload: { config, secret },
      },
    } = args

    if (!args.req.user) throw new Forbidden(args.req.t)

    const parsedURL = url.parse(args.req.url)
    const isGraphQL = parsedURL.pathname === config.routes.graphQL

    const user = await args.req.payload.findByID({
      id: args.req.user.id,
      collection: args.req.user.collection,
      depth: isGraphQL ? 0 : args.collection.config.auth.depth,
      req: args.req,
    })

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

      const refreshedToken = jwt.sign(fieldsToSign, secret, {
        expiresIn: collectionConfig.auth.tokenExpiration,
      })

      const exp = (jwt.decode(refreshedToken) as Record<string, unknown>).exp as number

      if (args.res) {
        const cookieOptions = {
          domain: undefined,
          expires: getCookieExpiration(collectionConfig.auth.tokenExpiration),
          httpOnly: true,
          path: '/',
          sameSite: collectionConfig.auth.cookies.sameSite,
          secure: collectionConfig.auth.cookies.secure,
        }

        if (collectionConfig.auth.cookies.domain)
          cookieOptions.domain = collectionConfig.auth.cookies.domain

        args.res.cookie(`${config.cookiePrefix}-token`, refreshedToken, cookieOptions)
      }

      result = {
        exp,
        refreshedToken,
        strategy: args.req.user._strategy,
        user,
      }
    }

    // /////////////////////////////////////
    // After Refresh - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterRefresh.reduce(async (priorHook, hook) => {
      await priorHook

      result =
        (await hook({
          collection: args.collection?.config,
          context: args.req.context,
          exp: result.exp,
          req: args.req,
          res: args.res,
          token: result.refreshedToken,
        })) || result
    }, Promise.resolve())

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

    if (collectionConfig.auth.removeTokenFromResponses) {
      delete result.refreshedToken
    }

    if (shouldCommit) await commitTransaction(args.req)

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}

export default refresh
