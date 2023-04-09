import { DateField } from '../../../../../fields/config/types';
export type Props = Omit<DateField, 'type'> & {
    path: string;
};
