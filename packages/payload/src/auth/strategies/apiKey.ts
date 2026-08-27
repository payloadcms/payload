import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { User } from '../../index.js'
import type { Where } from '../../types/index.js'
import type { AuthStrategyFunction } from '../index.js'

import { payloadAPIKeysCollectionSlug } from '../apiKeys/config.js'
import { hashAPIKeySecret } from '../apiKeys/hash.js'
import { computeAPIKeyIndex } from '../crypto.js'
import { getAPIKeyStorageMode } from '../getAPIKeyStorageMode.js'

const parseAPIKeyHeader = ({
  authHeader,
  collectionSlug,
}: {
  authHeader: null | string
  collectionSlug: string
}): null | string => {
  const prefix = `${collectionSlug} API-Key `

  if (!authHeader?.startsWith(prefix)) {
    return null
  }

  const apiKey = authHeader.replace(prefix, '')

  return apiKey ? apiKey : null
}

/**
 * `auth.useAPIKey: true` (deprecated): the key lives on the auth document itself.
 */
const legacyAPIKeyAuthentication =
  (collectionConfig: SanitizedCollectionConfig): AuthStrategyFunction =>
  async ({ headers, isGraphQL = false, payload }) => {
    const apiKey = parseAPIKeyHeader({
      authHeader: headers.get('Authorization'),
      collectionSlug: collectionConfig.slug,
    })

    if (!apiKey) {
      return { user: null }
    }

    // The stored index was written under whichever secret was active at the
    // time, so match against the index computed under every keyring secret.
    const apiKeyIndexes = payload.encryptionKeyring.all.map((key) =>
      computeAPIKeyIndex(key.legacyKey, apiKey),
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

    return { user: null }
  }

/**
 * `auth.useAPIKey: { storage: 'collection' }`: the key lives in the shared
 * `payload-api-keys` collection, matched by the one-way `apiKeyHash` of the presented
 * secret - there is nothing reversible to decrypt, so no separate step is needed to avoid
 * it. The lookup selects only `id`/`owner`, then loads the owner from the header's auth
 * collection. There is no fallback to legacy fields: deleting a collection-mode key is a
 * final revocation.
 */
const collectionAPIKeyAuthentication =
  (collectionConfig: SanitizedCollectionConfig): AuthStrategyFunction =>
  async ({ headers, isGraphQL = false, payload }) => {
    const apiKey = parseAPIKeyHeader({
      authHeader: headers.get('Authorization'),
      collectionSlug: collectionConfig.slug,
    })

    if (!apiKey) {
      return { user: null }
    }

    const apiKeyHash = hashAPIKeySecret(apiKey)

    try {
      const keyQuery = await payload.find({
        collection: payloadAPIKeysCollectionSlug,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        select: { owner: true },
        where: {
          and: [
            { apiKeyHash: { equals: apiKeyHash } },
            { 'owner.relationTo': { equals: collectionConfig.slug } },
          ],
        },
      })

      const owner = keyQuery.docs?.[0]?.owner as
        | { relationTo?: string; value?: number | string }
        | undefined

      if (!owner?.value) {
        return { user: null }
      }

      const user = await payload.findByID({
        id: owner.value,
        collection: collectionConfig.slug,
        depth: isGraphQL ? 0 : collectionConfig.auth.depth,
        overrideAccess: true,
      })

      if (!user) {
        return { user: null }
      }

      if (collectionConfig.auth?.verify && (user as { _verified?: boolean })._verified === false) {
        return { user: null }
      }

      user.collection = collectionConfig.slug
      user._strategy = 'api-key'

      return { user: user as User }
    } catch (ignore) {
      return { user: null }
    }
  }

export const APIKeyAuthentication = (
  collectionConfig: SanitizedCollectionConfig,
): AuthStrategyFunction =>
  getAPIKeyStorageMode(collectionConfig.auth) === 'collection'
    ? collectionAPIKeyAuthentication(collectionConfig)
    : legacyAPIKeyAuthentication(collectionConfig)
