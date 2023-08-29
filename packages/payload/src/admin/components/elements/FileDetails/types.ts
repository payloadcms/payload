import { SanitizedCollectionConfig } from '../../../../collections/config/types.js';
import { FileSizes } from '../../../../uploads/types.js';
import { Data } from '../../forms/Form/types.js';

export type Props = {
  collection: SanitizedCollectionConfig
  doc: Data & {
    sizes?: FileSizes
  }
  handleRemove?: () => void,
}
