import jwt from 'jsonwebtoken'

import type { Where } from '../../types/index.js'
import type { AuthStrategyFunction, User } from '../index.js'

import { extractJWT } from '../extractJWT.js'

type JWTToken = {
  collection: string
  id: string
}

export const JWTAuthentication: AuthStrategyFunction = async ({
  headers,
  isGraphQL = false,
  payload,
}) => {
  try {
    const token = extractJWT({ headers, payload })

    if (
      !token &&
      typeof payload?.config?.admin?.autoLogin === 'object' &&
      !payload.config.admin?.autoLogin.prefillOnly &&
      headers.get('DisableAutologin') !== 'true'
    ) {
      const collection = payload.collections[payload.config.admin.user]

      const where: Where = {
        or: [],
      }
      if (payload.config.admin?.autoLogin.email) {
        where.or.push({
          email: {
            equals: payload.config.admin?.autoLogin.email,
          },
        })
      } else if (payload.config.admin?.autoLogin.username) {
        where.or.push({
          username: {
            equals: payload.config.admin?.autoLogin.username,
          },
        })
      }

      const user = (
        await payload.find({
          collection: collection.config.slug,
          depth: isGraphQL ? 0 : collection.config.auth.depth,
          where,
        })
      ).docs[0]
      user.collection = collection.config.slug
      user._strategy = 'local-jwt'
      return {
        user: user as User,
      }
    }

    const decodedPayload = jwt.verify(token, payload.secret) as JWTToken & jwt.JwtPayload

    const collection = payload.collections[decodedPayload.collection]

    const user = await payload.findByID({
      id: decodedPayload.id,
      collection: decodedPayload.collection,
      depth: isGraphQL ? 0 : collection.config.auth.depth,
    })

    if (user && (!collection.config.auth.verify || user._verified)) {
      user.collection = collection.config.slug
      user._strategy = 'local-jwt'
      return {
        user: user as User,
      }
    } else {
      return { user: null }
    }
  } catch (error) {
    return { user: null }
  }
}
