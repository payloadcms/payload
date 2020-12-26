import { Field } from '../../../../../../fields/config/types';
import { CollectionConfig } from '../../../../../../collections/config/types';

export type Props = {
  field: Field
  colIndex: number
  collection: CollectionConfig
  cellData: unknown
  rowData: {
    [path: string]: unknown
  }
}
