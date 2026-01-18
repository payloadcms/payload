import type { ClientField, FormState, SanitizedFieldPermissions } from 'payload';
export type SelectedField = {
    field: ClientField;
    fieldPermissions: SanitizedFieldPermissions;
    path: string;
};
export type FieldOption = {
    label: React.ReactNode;
    value: SelectedField;
};
export declare const ignoreFromBulkEdit: (field: ClientField) => boolean;
export declare const reduceFieldOptions: ({ fields, formState, labelPrefix, parentPath, path, permissions, }: {
    readonly fields: ClientField[];
    readonly formState?: FormState;
    readonly labelPrefix?: React.ReactNode;
    readonly parentPath?: string;
    readonly path?: string;
    readonly permissions: {
        [fieldName: string]: SanitizedFieldPermissions;
    } | SanitizedFieldPermissions;
}) => FieldOption[];
//# sourceMappingURL=reduceFieldOptions.d.ts.map