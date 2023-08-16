import { UploadField } from '../../../../../fields/config/types';
import { FieldTypes } from '../types';

export type Props = Omit<UploadField, 'type'> & {
  path?: string
  fieldTypes: FieldTypes
}
