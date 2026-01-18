import type { Option, OptionObject } from 'payload';
import React from 'react';
import type { SelectInputProps } from './Input.js';
import { SelectInput } from './Input.js';
export declare const formatOptions: (options: Option[]) => OptionObject[];
export declare const SelectField: React.FC<{
    readonly onChange?: (e: string | string[]) => void;
    readonly path: string;
    readonly validate?: import("payload").SelectFieldValidation;
    readonly value?: string | string[];
} & {
    readonly field: Omit<import("payload").SelectFieldClient, "type"> & Partial<Pick<import("payload").SelectFieldClient, "type">>;
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
export { SelectInput, type SelectInputProps };
//# sourceMappingURL=index.d.ts.map