import { UploadField } from '../../../../../fields/config/types.js';
import { FieldTypes } from '../index.js';

export type Props = Omit<UploadField, 'type'> & {
  path?: string
  fieldTypes: FieldTypes
}
