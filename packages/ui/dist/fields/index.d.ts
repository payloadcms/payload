import type { ClientFieldBase, FieldTypes, GenericDescriptionProps, GenericErrorProps, GenericLabelProps, HiddenFieldProps } from 'payload';
import type React from 'react';
import type { ConfirmPasswordFieldProps } from './ConfirmPassword/index.js';
export * from './shared/index.js';
export type FieldTypesComponents = {
    [K in 'password' | FieldTypes]: React.FC<ClientFieldBase>;
} & {
    confirmPassword: React.FC<ConfirmPasswordFieldProps>;
    hidden: React.FC<HiddenFieldProps>;
};
export declare const fieldComponents: FieldTypesComponents;
export type FieldComponentsWithSlots = {
    Description: React.FC<GenericDescriptionProps>;
    Error: React.FC<GenericErrorProps>;
    Label: React.FC<GenericLabelProps>;
    RowLabel: React.FC;
} & FieldTypesComponents;
export declare const allFieldComponents: FieldComponentsWithSlots;
//# sourceMappingURL=index.d.ts.map