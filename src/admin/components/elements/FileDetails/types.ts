import { CollectionConfig } from '../../../../collections/config/types';

export type Props = {
  collection: CollectionConfig
  doc: Record<string, unknown>
  handleRemove?: () => void,
}
