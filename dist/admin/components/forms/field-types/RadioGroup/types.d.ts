import { RadioField } from '../../../../../fields/config/types';
export type Props = Omit<RadioField, 'type'> & {
    path?: string;
};
export type OnChange<T = string> = (value: T) => void;
