import type { TextareaFieldValidation } from 'payload';
import React from 'react';
import type { TextAreaInputProps } from './types.js';
import './index.scss';
import { TextareaInput } from './Input.js';
export { TextareaInput, TextAreaInputProps };
export declare const TextareaField: React.FC<{
    readonly inputRef?: React.Ref<HTMLInputElement>;
    readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
    readonly path: string;
    readonly validate?: TextareaFieldValidation;
} & {
    readonly field: Omit<import("payload").TextareaFieldClient, "type"> & Partial<Pick<import("payload").TextareaFieldClient, "type">>;
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map