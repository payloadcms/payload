import { jwtVerify } from 'jose'

import type { Payload, Where } from '../../types/index.js'
import type { AuthStrategyFunction, AuthStrategyResult } from '../index.js'

import { extractJWT } from '../extractJWT.js'

type JWTToken = {
  collection: string
  id: string
  sid?: string
}

/**
 * Verifies a token against every secret in the keyring (active first), so tokens
 * signed under a previous secret still validate during a bounded rotation.
 * Throws if no key verifies.
 */
async function verifyWithKeyring({
  payload,
  token,
}: {
  payload: Payload
  token: string
}): Promise<JWTToken> {
  let lastError: unknown
  for (const key of payload.encryptionKeyring.all) {
    try {
      const { payload: decodedPayload } = await jwtVerify<JWTToken>(
        token,
        new TextEncoder().encode(key.legacyKey),
      )
      return decodedPayload
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
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

    // Verify against every keyring secret so tokens signed under a previous
    // secret still validate during a bounded rotation. New tokens are always
    // signed with the active secret.
    const decodedPayload = await verifyWithKeyring({ payload, token })
    const collection = payload.collections[decodedPayload.collection]

    const user = (await payload.findByID({
      id: decodedPayload.id,
      collection: decodedPayload.collection,
      depth: isGraphQL ? 0 : collection!.config.auth.depth,
    })) as AuthStrategyResult['user']

    if (user && (!collection!.config.auth.verify || user._verified)) {
      if (collection!.config.auth.useSessions) {
        const existingSession = (user.sessions || []).find(({ id }) => id === decodedPayload.sid)

        if (!existingSession || !decodedPayload.sid) {
          return {
            user: null,
          }
        }

        user._sid = decodedPayload.sid
      }

      user.collection = collection!.config.slug
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
