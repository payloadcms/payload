import { SanitizedCollectionConfig } from '../collections/config/types.js';
import { SanitizedGlobalConfig } from '../globals/config/types.js';

export const getVersionsModelName = (entity: SanitizedCollectionConfig | SanitizedGlobalConfig): string => `_${entity.slug}_versions`;
