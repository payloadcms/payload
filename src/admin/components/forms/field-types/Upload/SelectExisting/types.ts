import { CollectionConfig } from '../../../../../../collections/config/types';

export type Props = {
  setValue: (val: { id: string } | null) => void
  collection: CollectionConfig
  slug: string
}
