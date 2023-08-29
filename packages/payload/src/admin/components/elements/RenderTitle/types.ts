import type { SanitizedCollectionConfig } from '../../../../collections/config/types.js';

export type Props = {
  collection?: SanitizedCollectionConfig
  data?: {
    id?: string
  }
  fallback?: string
  title?: string
  useAsTitle?: string
}
