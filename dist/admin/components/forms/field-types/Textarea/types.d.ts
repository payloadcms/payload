import { TextareaField } from '../../../../../fields/config/types';
export type Props = Omit<TextareaField, 'type'> & {
    path?: string;
};
