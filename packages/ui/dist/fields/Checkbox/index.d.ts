import type { CheckboxFieldClientProps, CheckboxFieldValidation } from 'payload';
import React from 'react';
import type { CheckboxInputProps } from './Input.js';
import { CheckboxInput } from './Input.js';
import './index.scss';
export { CheckboxFieldClientProps, CheckboxInput, type CheckboxInputProps };
export declare const CheckboxField: React.FC<{
    readonly checked?: boolean;
    readonly disableFormData?: boolean;
    readonly id?: string;
    readonly onChange?: (value: boolean) => void;
    readonly partialChecked?: boolean;
    readonly path: string;
    readonly validate?: CheckboxFieldValidation;
} & {
    readonly field: Omit<import("payload").CheckboxFieldClient, "type"> & Partial<Pick<import("payload").CheckboxFieldClient, "type">>;
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map