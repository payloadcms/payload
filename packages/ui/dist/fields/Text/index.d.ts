import React from 'react';
import type { TextInputProps } from './types.js';
import { TextInput } from './Input.js';
import './index.scss';
export { TextInput, TextInputProps };
export declare const TextField: React.FC<{
    readonly inputRef?: React.RefObject<HTMLInputElement>;
    readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
    readonly path: string;
    readonly validate?: import("payload").TextFieldValidation;
} & {
    readonly field: Omit<import("payload").TextFieldClient, "type"> & Partial<Pick<import("payload").TextFieldClient, "type">>;
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map