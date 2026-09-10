import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { Payload } from '../../index.js'
import type { Where } from '../../types/index.js'

import { hasLocalizeStatusEnabled } from '../../utilities/getVersionsConfig.js'

export type GetPublishedStatusWhereArgs = {
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  locale?: string
  payload: Payload
}

/**
 * Constraint that selects published main documents. Rows written before `_status` existed are
 * treated as published for backwards compatibility.
 */
export function getPublishedStatusWhere({
  entity,
  locale,
  payload,
}: GetPublishedStatusWhereArgs): Where {
  const publishedConditions: Where[] = []

  if (hasLocalizeStatusEnabled(entity)) {
    if (locale === 'all') {
      const localeCodes = payload.config.localization ? payload.config.localization.localeCodes : []

      for (const localeCode of localeCodes) {
        publishedConditions.push({
          [`_status.${localeCode}`]: {
            equals: 'published',
          },
        })
      }
    } else if (locale) {
      publishedConditions.push({
        [`_status.${locale}`]: {
          equals: 'published',
        },
      })
    }
  }

  if (publishedConditions.length === 0) {
    publishedConditions.push({
      _status: {
        equals: 'published',
      },
    })
  }

  publishedConditions.push({
    _status: {
      exists: false,
    },
  })

  return {
    or: publishedConditions,
  }
}
