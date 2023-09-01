import type { SanitizedCollectionConfig } from '../../../../collections/config/types';

export type Props = {
  collection?: SanitizedCollectionConfig
  data?: {
    id?: string
  }
  fallback?: string
  title?: string
  useAsTitle?: string
}
