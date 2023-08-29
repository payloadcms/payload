import type { SanitizedCollectionConfig } from '../../../../collections/config/types.js';
import type { SanitizedGlobalConfig } from '../../../../globals/config/types.js';

export type Props = {
  collection?: SanitizedCollectionConfig,
  global?: SanitizedGlobalConfig
  id?: number | string
}
