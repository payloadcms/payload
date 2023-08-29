import { SanitizedCollectionConfig } from '../../../../collections/config/types.js';

export type Props = {
  collection: SanitizedCollectionConfig
  sort?: string,
  handleChange?: (sort: string) => void
  modifySearchQuery?: boolean
}
