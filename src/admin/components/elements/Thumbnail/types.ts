import { SanitizedCollectionConfig } from '../../../../collections/config/types';

export type Props = {
  doc: Record<string, unknown>
  collection: SanitizedCollectionConfig
  size?: 'small' | 'medium' | 'large' | 'expand',
  className?: string
}
