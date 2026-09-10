import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { Payload } from '../../index.js'
import type { Where } from '../../types/index.js'

import { hasLocalizeStatusEnabled } from '../../utilities/getVersionsConfig.js'

export type GetDraftStatusWhereArgs = {
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  locale?: string
  payload: Payload
}

/**
 * Constraint that selects version records whose latest status is draft.
 * Used for draft-only list reads and for `replaceWithVersion` lookups.
 */
export function getDraftStatusWhere({ entity, locale, payload }: GetDraftStatusWhereArgs): Where {
  if (hasLocalizeStatusEnabled(entity)) {
    if (locale === 'all') {
      return {
        or: ((payload.config.localization && payload.config.localization.localeCodes) || []).map(
          (localeCode) => ({
            [`version._status.${localeCode}`]: {
              equals: 'draft',
            },
          }),
        ),
      }
    }

    if (locale) {
      return {
        [`version._status.${locale}`]: {
          equals: 'draft',
        },
      }
    }
  }

  return {
    'version._status': {
      equals: 'draft',
    },
  }
}
