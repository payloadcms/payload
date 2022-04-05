import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import { FilterOptions } from '../../../../../../fields/config/types';

export type Props = {
  setValue: (val: { id: string } | null) => void
  collection: SanitizedCollectionConfig
  slug: string
  path
  filterOptions: FilterOptions
}
