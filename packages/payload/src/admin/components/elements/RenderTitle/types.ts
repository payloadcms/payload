import { SanitizedCollectionConfig } from '../../../../collections/config/types.js';

export type Props = {
  useAsTitle?: string
  data?: {
    id?: string
  }
  title?: string
  fallback?: string
  collection?: SanitizedCollectionConfig
}
