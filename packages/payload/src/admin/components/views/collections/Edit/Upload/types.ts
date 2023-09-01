import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import type { Fields } from '../../../../forms/Form/types';

export type Props = {
  adminThumbnail?: string
  collection: SanitizedCollectionConfig
  data?: Fields
  internalState?: Fields
  mimeTypes?: string[];
}
