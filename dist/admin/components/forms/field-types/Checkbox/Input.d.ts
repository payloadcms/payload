import React from 'react';
import './index.scss';
type CheckboxInputProps = {
    onToggle: React.MouseEventHandler<HTMLButtonElement>;
    inputRef?: React.MutableRefObject<HTMLInputElement>;
    readOnly?: boolean;
    checked?: boolean;
    name?: string;
    id?: string;
    label?: string;
    required?: boolean;
};
export declare const CheckboxInput: React.FC<CheckboxInputProps>;
export {};
