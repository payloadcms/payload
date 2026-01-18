import type { ClientField, FormState, SanitizedFieldPermissions } from 'payload';
import React from 'react';
import type { FieldAction } from '../../forms/Form/types.js';
import type { FieldOption } from './reduceFieldOptions.js';
import './index.scss';
export type OnFieldSelect = ({ dispatchFields, formState, selected, }: {
    dispatchFields: React.Dispatch<FieldAction>;
    formState: FormState;
    selected: FieldOption[];
}) => void;
export type FieldSelectProps = {
    readonly fields: ClientField[];
    readonly onChange: OnFieldSelect;
    readonly permissions: {
        [fieldName: string]: SanitizedFieldPermissions;
    } | SanitizedFieldPermissions;
};
export declare const FieldSelect: React.FC<FieldSelectProps>;
//# sourceMappingURL=index.d.ts.map