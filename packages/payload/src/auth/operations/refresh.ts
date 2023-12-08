// TODO(JARROD): remove express Response
import type { Response } from 'express'

import jwt from 'jsonwebtoken'
import url from 'url'

import type { BeforeOperationHook, Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../types'
import type { Document } from '../../types'

import { buildAfterOperation } from '../../collections/operations/utils'
import { Forbidden } from '../../errors'
import getCookieExpiration from '../../utilities/getCookieExpiration'
import { getFieldsToSign } from './getFieldsToSign'

export type Result = {
  exp: number
  refreshedToken: string
  user: Document
}

export type Arguments = {
  collection: Collection
  req: PayloadRequest
  res?: Response
  token: string
}

async function refresh(incomingArgs: Arguments): Promise<Result> {
  let args = incomingArgs

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

  if (typeof args.token !== 'string' || !args.req.user) throw new Forbidden(args.req.t)

  const parsedURL = url.parse(args.req.url)
  const isGraphQL = parsedURL.pathname === config.routes.graphQL

  const user = await args.req.payload.findByID({
    id: args.req.user.id,
    collection: args.req.user.collection,
    depth: isGraphQL ? 0 : args.collection.config.auth.depth,
    req: args.req,
  })

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

  let result: Result = {
    exp,
    refreshedToken,
    user,
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
        exp,
        req: args.req,
        res: args.res,
        token: refreshedToken,
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

  return result
}

export default refresh
