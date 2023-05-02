/// <reference types="react" />
import { TextField } from '../../../../../fields/config/types';
export type Props = Omit<TextField, 'type'> & {
    path?: string;
    inputRef?: React.MutableRefObject<HTMLInputElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};
