import { SanitizedCollectionConfig } from '../../../../../../collections/config/types.js';
import { Fields } from '../../../../forms/Form/types.js';

export type Props = {
  internalState?: Fields
  data?: Fields
  collection: SanitizedCollectionConfig
  adminThumbnail?: string
  mimeTypes?: string[];
}
