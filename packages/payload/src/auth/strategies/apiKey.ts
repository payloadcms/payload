import crypto from 'crypto'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { User } from '../../index.js'
import type { Where } from '../../types/index.js'
import type { AuthStrategyFunction } from '../index.js'

export const APIKeyAuthentication =
  (collectionConfig: SanitizedCollectionConfig): AuthStrategyFunction =>
  async ({ headers, isGraphQL = false, payload }) => {
    const authHeader = headers.get('Authorization')

    if (authHeader?.startsWith(`${collectionConfig.slug} API-Key `)) {
      const apiKey = authHeader.replace(`${collectionConfig.slug} API-Key `, '')

      const sha256APIKeyIndex = crypto
        .createHmac('sha256', payload.secret)
        .update(apiKey)
        .digest('hex')

      try {
        const where: Where = {}
        if (collectionConfig.auth?.verify) {
          where.and = [
            {
              apiKeyIndex: {
                equals: sha256APIKeyIndex,
              },
            },
            {
              _verified: {
                not_equals: false,
              },
            },
          ]
        } else {
          where.apiKeyIndex = { equals: sha256APIKeyIndex }
        }

        const userQuery = await payload.find({
          collection: collectionConfig.slug,
          depth: isGraphQL ? 0 : collectionConfig.auth.depth,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          where,
        })

        if (userQuery.docs && userQuery.docs.length > 0) {
          const user = userQuery.docs[0]
          user!.collection = collectionConfig.slug
          user!._strategy = 'api-key'

          return {
            user: user as User,
          }
        }
      } catch (ignore) {
        return { user: null }
      }
    }

    return { user: null }
  }
