import { SanitizedCollectionConfig } from '../../../../collections/config/types';

export type Props = {
  collection: SanitizedCollectionConfig,
  handleChange: (columns) => void,
}
