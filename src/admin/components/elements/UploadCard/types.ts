import { CollectionConfig } from '../../../../collections/config/types';
import { FileSizes } from '../../../../uploads/types';

export type Props = {
  collection: CollectionConfig,
  id: string,
  filename: string,
  mimeType: string,
  sizes?: FileSizes,
  onClick?: () => void,
}
