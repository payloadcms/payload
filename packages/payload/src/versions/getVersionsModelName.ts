import type { SanitizedCollectionConfig } from '../collections/config/types'
import type { SanitizedGlobalConfig } from '../globals/config/types'

/**
 * This function is not being used and will no longer be exported in the future
 * @deprecated
 * @param entity
 */
export const getVersionsModelName = (
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig,
): string => `_${entity.slug}_versions`
