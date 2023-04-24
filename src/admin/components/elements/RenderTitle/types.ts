import { SanitizedCollectionConfig } from '../../../../collections/config/types';

export type Props = {
  useAsTitle?: string
  data?: {
    id?: string
  }
  title?: string
  fallback?: string
  collection?: SanitizedCollectionConfig
}
