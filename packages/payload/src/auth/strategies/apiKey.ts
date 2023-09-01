import crypto from 'crypto'
import PassportAPIKey from 'passport-headerapikey'

import type { SanitizedCollectionConfig } from '../../collections/config/types'
import type { PayloadRequest } from '../../express/types'
import type { Payload } from '../../payload'

import find from '../../collections/operations/find'

export default (payload: Payload, config: SanitizedCollectionConfig): PassportAPIKey => {
  const { secret } = payload
  const opts = {
    header: 'Authorization',
    prefix: `${config.slug} API-Key `,
  }

  return new PassportAPIKey(opts, true, async (apiKey, done, req) => {
    const apiKeyIndex = crypto.createHmac('sha1', secret).update(apiKey).digest('hex')

    try {
      const where: { [key: string]: any } = {}
      if (config.auth.verify) {
        where.and = [
          {
            // TODO: Search for index
            apiKeyIndex: {
              equals: apiKeyIndex,
            },
          },
          {
            _verified: {
              not_equals: false,
            },
          },
        ]
      } else {
        where.apiKeyIndex = {
          equals: apiKeyIndex,
        }
      }
      const userQuery = await find({
        collection: {
          config,
        },
        depth: config.auth.depth,
        overrideAccess: true,
        req: req as PayloadRequest,
        where,
      })

      if (userQuery.docs && userQuery.docs.length > 0) {
        const user = userQuery.docs[0]
        user.collection = config.slug
        user._strategy = 'api-key'
        done(null, user)
      } else {
        done(null, false)
      }
    } catch (err) {
      done(null, false)
    }
  })
}
