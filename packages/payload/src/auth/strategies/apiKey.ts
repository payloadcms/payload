import crypto from 'crypto'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { User } from '../../index.js'
import type { Where } from '../../types/index.js'
import type { AuthStrategyFunction } from '../index.js'

import { getAPIKeyLast4 } from '../baseFields/apiKey/getAPIKeyLast4.js'
import { legacyAPIKeyLast4 } from '../baseFields/apiKey/omitAPIKey.js'

export const APIKeyAuthentication =
  (collectionConfig: SanitizedCollectionConfig): AuthStrategyFunction =>
  async ({ headers, isGraphQL = false, payload, req }) => {
    const authHeader = headers.get('Authorization')

    if (authHeader?.startsWith(`${collectionConfig.slug} API-Key `)) {
      const apiKey = authHeader.replace(`${collectionConfig.slug} API-Key `, '')

      // The stored index was written under whichever secret was active at the
      // time, so match against the index computed under every keyring secret.
      const apiKeyIndexes = payload.encryptionKeyring.all.map((key) =>
        crypto.createHmac('sha256', key.legacyKey).update(apiKey).digest('hex'),
      )

      const requestFallbackLocale = req?.fallbackLocale
      const requestLocale = req?.locale
      const requestDepth = req?.query?.depth

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
          fallbackLocale: requestFallbackLocale,
          limit: 1,
          locale: requestLocale,
          overrideAccess: true,
          pagination: false,
          req,
          where,
        })

        if (userQuery.docs && userQuery.docs.length > 0) {
          const user = userQuery.docs[0]
          const apiKeyLast4 = getAPIKeyLast4(apiKey)

          if (user?.apiKeyLast4 === legacyAPIKeyLast4 && apiKeyLast4 !== legacyAPIKeyLast4) {
            try {
              await payload.db.updateOne({
                id: user.id,
                collection: collectionConfig.slug,
                data: { apiKeyLast4 },
                req,
                returning: false,
              })
              user.apiKeyLast4 = apiKeyLast4
            } catch (err) {
              payload.logger.error({
                err,
                msg: `Failed to backfill API key last four for ${collectionConfig.slug} ${user.id}`,
              })
            }
          }

          user!.collection = collectionConfig.slug
          user!._strategy = 'api-key'

          return {
            user: user as User,
          }
        }
      } catch (ignore) {
        return { user: null }
      } finally {
        if (req) {
          req.fallbackLocale = requestFallbackLocale!
          req.locale = requestLocale!

          if (req.query) {
            req.query.depth = requestDepth
          }
        }
      }
    }

    return { user: null }
  }
