import { NumberField } from '../../../../../fields/config/types';
export type Props = Omit<NumberField, 'type'> & {
    path?: string;
};
