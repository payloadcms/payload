import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Payload, User } from '../../index.js'
import type { Where } from '../../types/index.js'
import type { AuthStrategyFunction } from '../index.js'

import { hashAPIKey } from '../apiKeys/hash.js'

/** Collections already checked for pre-hash key material, so the warning is logged once. */
const collectionsCheckedForLegacyKeys = new Set<string>()

/**
 * A key that fails to match may simply be wrong, but it may also be a key written before
 * keys were stored as one-way hashes - which no longer authenticates until
 * `migrateAPIKeysToHash` has run. Checked at most once per collection per process, so a
 * stream of bad keys cannot turn into a stream of queries.
 */
const warnOnceAboutLegacyAPIKeys = async ({
  collectionSlug,
  payload,
}: {
  collectionSlug: string
  payload: Payload
}): Promise<void> => {
  if (collectionsCheckedForLegacyKeys.has(collectionSlug)) {
    return
  }

  collectionsCheckedForLegacyKeys.add(collectionSlug)

  try {
    const { totalDocs } = await payload.count({
      collection: collectionSlug,
      overrideAccess: true,
      // Ciphertext written by any recent version carries this prefix, and a hash can never
      // contain a colon. Pre-v1 aes-256-ctr values have no prefix and are not detected.
      where: { apiKey: { contains: 'v1:' } },
    })

    if (totalDocs > 0) {
      payload.logger.warn(
        `Collection "${collectionSlug}" still has ${totalDocs} API key(s) stored in the pre-hash encrypted format. Those keys cannot authenticate until you run the "migrateAPIKeysToHash" migration.`,
      )
    }
  } catch (_error) {
    // Never let this diagnostic affect the outcome of an authentication attempt.
  }
}

export const APIKeyAuthentication =
  (collectionConfig: SanitizedCollectionConfig): AuthStrategyFunction =>
  async ({ headers, isGraphQL = false, payload }) => {
    const authHeader = headers.get('Authorization')

    if (authHeader?.startsWith(`${collectionConfig.slug} API-Key `)) {
      const apiKey = authHeader.replace(`${collectionConfig.slug} API-Key `, '')

      // A one-way hash of the key, derived without `payload.secret` or the encryption
      // keyring, so rotating or retiring the secret has no effect on stored keys.
      const apiKeyHash = hashAPIKey(apiKey)

      try {
        const where: Where = {}

        if (collectionConfig.auth?.verify) {
          where.and = [
            {
              apiKey: {
                equals: apiKeyHash,
              },
            },
            {
              _verified: {
                not_equals: false,
              },
            },
          ]
        } else {
          where.apiKey = { equals: apiKeyHash }
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

        await warnOnceAboutLegacyAPIKeys({ collectionSlug: collectionConfig.slug, payload })
      } catch (ignore) {
        return { user: null }
      }
    }

    return { user: null }
  }
