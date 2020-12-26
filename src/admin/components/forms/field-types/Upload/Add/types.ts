import { CollectionConfig } from '../../../../../../collections/config/types';
import { FieldTypes } from '../..';

export type Props = {
  setValue: (val: { id: string } | null) => void
  collection: CollectionConfig
  slug: string
  fieldTypes: FieldTypes
}
