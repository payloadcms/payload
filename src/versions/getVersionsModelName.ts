import { SanitizedCollectionConfig } from '../collections/config/types';
import { SanitizedGlobalConfig } from '../globals/config/types';

export const getVersionsModelName = (entity: SanitizedCollectionConfig | SanitizedGlobalConfig): string => `_${entity.slug}_versions`;
