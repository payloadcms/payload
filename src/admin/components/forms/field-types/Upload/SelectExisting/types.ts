import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';

export type Props = {
  setValue: (val: { id: string } | null) => void
  collection: SanitizedCollectionConfig
  slug: string
}
