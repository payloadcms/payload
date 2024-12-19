import { jwtVerify } from 'jose'

import type { Payload, Where } from '../../types/index.js'
import type { AuthStrategyFunction, User } from '../index.js'

import { extractJWT } from '../extractJWT.js'

type JWTToken = {
  collection: string
  id: string
}

async function autoLogin({
  isGraphQL,
  payload,
}: {
  isGraphQL: boolean
  payload: Payload
}): Promise<{
  user: null | User
}> {
  if (
    typeof payload?.config?.admin?.autoLogin !== 'object' ||
    payload.config.admin?.autoLogin.prefillOnly ||
    !payload?.config?.admin?.autoLogin ||
    (!payload.config.admin?.autoLogin.email && !payload.config.admin?.autoLogin.username)
  ) {
    return { user: null }
  }

  const collection = payload.collections[payload.config.admin.user]

  const where: Where = {
    or: [],
  }
  if (payload.config.admin?.autoLogin.email) {
    where.or?.push({
      email: {
        equals: payload.config.admin?.autoLogin.email,
      },
    })
  } else if (payload.config.admin?.autoLogin.username) {
    where.or?.push({
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

  if (!user) {
    return { user: null }
  }
  user.collection = collection.config.slug
  user._strategy = 'local-jwt'

  return {
    user: user as User,
  }
}

export const JWTAuthentication: AuthStrategyFunction = async ({
  headers,
  isGraphQL = false,
  payload,
}) => {
  try {
    const token = extractJWT({ headers, payload })

    if (!token) {
      if (headers.get('DisableAutologin') !== 'true') {
        return await autoLogin({ isGraphQL, payload })
      }
      return { user: null }
    }

    const secretKey = new TextEncoder().encode(payload.secret)
    const { payload: decodedPayload } = await jwtVerify<JWTToken>(token, secretKey)
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
      if (headers.get('DisableAutologin') !== 'true') {
        return await autoLogin({ isGraphQL, payload })
      }
      return { user: null }
    }
  } catch (ignore) {
    if (headers.get('DisableAutologin') !== 'true') {
      return await autoLogin({ isGraphQL, payload })
    }
    return { user: null }
  }
}
