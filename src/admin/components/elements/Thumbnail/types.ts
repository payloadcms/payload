import { CollectionConfig } from '../../../../collections/config/types';

export type Props = {
  doc: Record<string, unknown>
  collection: CollectionConfig
  size?: 'small' | 'medium' | 'large' | 'expand',
}
