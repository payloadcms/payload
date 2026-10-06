import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Where } from '../types/index.js'

import { hasLocalizeStatusEnabled } from '../utilities/getVersionsConfig.js'

/** Build a status constraint for the requested locale, or any configured locale for all. */
export function getVersionStatusQuery({
  entity,
  locale,
  localization,
  status,
}: {
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  locale?: null | string
  localization: SanitizedConfig['localization']
  status: 'draft' | 'published'
}): Where {
  if (!hasLocalizeStatusEnabled(entity) || !localization) {
    return { _status: { equals: status } }
  }

  if (locale === 'all' || locale === '*') {
    return {
      or: localization.localeCodes.map((code) => ({
        [`_status.${code}`]: { equals: status },
      })),
    }
  }

  return { [`_status.${locale || localization.defaultLocale}`]: { equals: status } }
}
