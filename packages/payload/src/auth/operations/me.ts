import jwt from 'jsonwebtoken'
import url from 'url'

import type { Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../express/types'
import type { User } from '../types'

import getExtractJWT from '../getExtractJWT'

export type Result = {
  collection?: string
  exp?: number
  strategy?: string
  token?: string
  user?: User
}

export type Arguments = {
  collection: Collection
  req: PayloadRequest
}

async function me(args: Arguments): Promise<Result> {
  const { collection, req } = args
  const extractJWT = getExtractJWT(req.payload.config)
  let response: Result = {
    user: null,
  }

  if (req.user) {
    const parsedURL = url.parse(req.originalUrl)
    const isGraphQL = parsedURL.pathname === `/api${req.payload.config.routes.graphQL}`

    const user = (await req.payload.findByID({
      id: req.user.id,
      collection: collection.config.slug,
      depth: isGraphQL ? 0 : collection.config.auth.depth,
      overrideAccess: false,
      req,
      showHiddenFields: false,
    })) as User

    if (req.user.collection !== collection.config.slug) {
      return {
        user: null,
      }
    }

    delete user.collection

    // /////////////////////////////////////
    // me hook - Collection
    // /////////////////////////////////////

    for (const meHook of collection.config.hooks.me) {
      const hookResult = await meHook({ args, user })

      if (hookResult) {
        response.user = hookResult.user
        response.exp = hookResult.exp

        break
      }
    }

    response.collection = req.user.collection
    response.strategy = req.user._strategy

    const token = extractJWT(req)

    if (!response.user) {
      response.user = user

      if (token) {
        const decoded = jwt.decode(token) as jwt.JwtPayload
        if (decoded) response.exp = decoded.exp
        if (!collection.config.auth.removeTokenFromResponses) response.token = token
      }
    }
  }

  // /////////////////////////////////////
  // After Me - Collection
  // /////////////////////////////////////

  await collection.config.hooks.afterMe.reduce(async (priorHook, hook) => {
    await priorHook

    response =
      (await hook({
        collection: collection?.config,
        context: req.context,
        req,
        response,
      })) || response
  }, Promise.resolve())

  return response
}

export default me
