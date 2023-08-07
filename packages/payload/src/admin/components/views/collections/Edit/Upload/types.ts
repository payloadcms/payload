import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import { Fields } from '../../../../forms/Form/types';

export type Props = {
  internalState?: Fields
  data?: Fields
  collection: SanitizedCollectionConfig
  adminThumbnail?: string
  mimeTypes?: string[];
}
