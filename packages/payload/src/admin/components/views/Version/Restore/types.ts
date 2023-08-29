import { SanitizedCollectionConfig } from '../../../../../collections/config/types.js';
import { SanitizedGlobalConfig } from '../../../../../globals/config/types.js';

export type Props = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  className?: string
  versionID: string
  originalDocID: string
  versionDate: string
}
