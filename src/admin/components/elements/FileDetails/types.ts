import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { FileSizes } from '../../../../uploads/types';
import { Data } from '../../forms/Form/types';

export type Props = {
  collection: SanitizedCollectionConfig
  doc: Data & {
    sizes?: FileSizes
  }
  handleRemove?: () => void,
}
