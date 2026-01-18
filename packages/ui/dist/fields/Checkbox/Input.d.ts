import type { StaticLabel } from 'payload';
import React from 'react';
export type CheckboxInputProps = {
    readonly AfterInput?: React.ReactNode;
    readonly BeforeInput?: React.ReactNode;
    readonly checked?: boolean;
    readonly className?: string;
    readonly id?: string;
    readonly inputRef?: React.RefObject<HTMLInputElement | null>;
    readonly Label?: React.ReactNode;
    readonly label?: StaticLabel;
    readonly localized?: boolean;
    readonly name?: string;
    readonly onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
    readonly partialChecked?: boolean;
    readonly readOnly?: boolean;
    readonly required?: boolean;
};
export declare const inputBaseClass = "checkbox-input";
export declare const CheckboxInput: React.FC<CheckboxInputProps>;
//# sourceMappingURL=Input.d.ts.map