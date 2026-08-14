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

      // The stored index was written under whichever secret was active at the
      // time, so match against the index computed under every keyring secret.
      const apiKeyIndexes = payload.encryptionKeyring.all.map((key) =>
        crypto.createHmac('sha256', key.legacyKey).update(apiKey).digest('hex'),
      )

      try {
        const where: Where = {}
        if (collectionConfig.auth?.verify) {
          where.and = [
            {
              apiKeyIndex: {
                in: apiKeyIndexes,
              },
            },
            {
              _verified: {
                not_equals: false,
              },
            },
          ]
        } else {
          where.apiKeyIndex = { in: apiKeyIndexes }
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
