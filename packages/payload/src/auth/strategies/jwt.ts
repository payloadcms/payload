import { jwtVerify } from 'jose'

import type { Payload, Where } from '../../types/index.js'
import type { AuthStrategyFunction, AuthStrategyResult } from '../index.js'

import { extractJWT } from '../extractJWT.js'
import { JWT_AUTH_VERSION } from '../jwtAuth.js'

type DecodedJWTPayload = Record<string, unknown>

type JWTAuthenticationReference = {
  collection: string
  id: number | string
  sid?: string
}

const getJWTAuthenticationReference = (
  token: DecodedJWTPayload,
): JWTAuthenticationReference | null => {
  const { id, collection, sid } = token

  if (
    typeof collection !== 'string' ||
    (typeof id !== 'number' && typeof id !== 'string') ||
    (typeof sid !== 'undefined' && typeof sid !== 'string')
  ) {
    return null
  }

  return {
    id,
    collection,
    ...(sid ? { sid } : {}),
  }
}

async function autoLogin({
  isGraphQL,
  payload,
  strategyName = 'local-jwt',
}: {
  isGraphQL: boolean
  payload: Payload
  strategyName?: string
}): Promise<{
  user: AuthStrategyResult['user']
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
      collection: collection!.config.slug,
      depth: isGraphQL ? 0 : collection!.config.auth.depth,
      limit: 1,
      pagination: false,
      where,
    })
  ).docs[0] as AuthStrategyResult['user']

  if (!user) {
    return { user: null }
  }
  user.collection = collection!.config.slug
  user._strategy = strategyName

  return {
    user,
  }
}

/**
 * Authentication strategy function for JWT tokens
 */
export const JWTAuthentication: AuthStrategyFunction = async ({
  headers,
  isGraphQL = false,
  payload,
  strategyName = 'local-jwt',
}) => {
  try {
    const token = extractJWT({ headers, payload })

    if (!token) {
      if (headers.get('DisableAutologin') !== 'true') {
        return await autoLogin({ isGraphQL, payload, strategyName })
      }
      return { user: null }
    }

    const secretKey = new TextEncoder().encode(payload.secret)
    const { payload: decodedPayload, protectedHeader } = await jwtVerify<DecodedJWTPayload>(
      token,
      secretKey,
    )

    if (protectedHeader.authVersion !== JWT_AUTH_VERSION) {
      throw new Error('Invalid JWT protected header')
    }

    const authenticationReference = getJWTAuthenticationReference(decodedPayload)

    if (!authenticationReference) {
      throw new Error('Invalid JWT authentication reference')
    }

    const collection = Object.prototype.hasOwnProperty.call(
      payload.collections,
      authenticationReference.collection,
    )
      ? payload.collections[authenticationReference.collection]
      : undefined

    if (!collection?.config.auth || collection.config.auth.disableLocalStrategy) {
      throw new Error('JWT authentication requires an auth-enabled local collection')
    }

    const user = (await payload.findByID({
      id: authenticationReference.id,
      collection: authenticationReference.collection,
      depth: isGraphQL ? 0 : collection.config.auth.depth,
    })) as AuthStrategyResult['user']

    if (user && (!collection.config.auth.verify || user._verified)) {
      if (collection.config.auth.useSessions) {
        const existingSession = (user.sessions || []).find(
          ({ id }) => id === authenticationReference.sid,
        )

        if (!existingSession || !authenticationReference.sid) {
          return {
            user: null,
          }
        }

        user._sid = authenticationReference.sid
      }

      user.collection = collection.config.slug
      user._strategy = strategyName
      return {
        user,
      }
    } else {
      if (headers.get('DisableAutologin') !== 'true') {
        return await autoLogin({ isGraphQL, payload, strategyName })
      }
      return { user: null }
    }
  } catch (ignore) {
    if (headers.get('DisableAutologin') !== 'true') {
      return await autoLogin({ isGraphQL, payload, strategyName })
    }
    return { user: null }
  }
}
