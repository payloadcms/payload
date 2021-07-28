import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import { FieldTypes } from '../..';

export type Props = {
  setValue: (val: { id: string } | null) => void
  collection: SanitizedCollectionConfig
  slug: string
  fieldTypes: FieldTypes
}
