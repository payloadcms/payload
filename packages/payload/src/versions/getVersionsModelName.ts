import type { SanitizedCollectionConfig } from '../collections/config/types'
import type { SanitizedGlobalConfig } from '../globals/config/types'

export const getVersionsModelName = (
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig,
): string => `_${entity.slug}_versions`
