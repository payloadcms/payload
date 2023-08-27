import { UploadField } from '../../../../../fields/config/types.js';
import { FieldTypes } from '..';

export type Props = Omit<UploadField, 'type'> & {
  path?: string
  fieldTypes: FieldTypes
}
