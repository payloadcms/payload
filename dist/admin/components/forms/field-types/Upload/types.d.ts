import { UploadField } from '../../../../../fields/config/types';
import { FieldTypes } from '..';
export type Props = Omit<UploadField, 'type'> & {
    path?: string;
    fieldTypes: FieldTypes;
};
