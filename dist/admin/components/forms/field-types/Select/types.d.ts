import { SelectField } from '../../../../../fields/config/types';
export type Props = Omit<SelectField, 'type'> & {
    path?: string;
};
