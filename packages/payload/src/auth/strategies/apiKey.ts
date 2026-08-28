import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { User } from '../../index.js'
import type { AuthStrategyFunction } from '../index.js'

import { payloadAPIKeysCollectionSlug } from '../apiKeys/config.js'
import { hashAPIKeySecret } from '../apiKeys/hash.js'

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
 * `auth.useAPIKey`: the key lives in the shared `payload-api-keys` collection, matched by
 * the one-way `apiKeyHash` of the presented secret - there is nothing reversible to
 * decrypt, so no separate step is needed to avoid it. The lookup selects only
 * `id`/`owner`, then loads the owner from the header's auth collection. There is no
 * fallback to on-document fields: deleting a key is a final revocation.
 */
export const APIKeyAuthentication =
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
