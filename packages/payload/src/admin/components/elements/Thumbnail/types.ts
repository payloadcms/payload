import type { SanitizedCollectionConfig } from '../../../../collections/config/types.js';

export type Props = {
  className?: string
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown>
  size?: 'expand' | 'large' | 'medium' | 'small',
}
