import { SanitizedCollectionConfig } from '../../../../collections/config/types';

export type Props = {
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown>
  handleRemove?: () => void,
}
