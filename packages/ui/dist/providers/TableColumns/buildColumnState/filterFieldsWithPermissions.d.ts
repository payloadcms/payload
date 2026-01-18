import type { ClientField, Field, SanitizedFieldPermissions, SanitizedFieldsPermissions } from 'payload';
export declare const filterFieldsWithPermissions: <T extends ClientField | Field = ClientField>({ fieldPermissions, fields, }: {
    fieldPermissions?: SanitizedFieldPermissions | SanitizedFieldsPermissions;
    fields: (ClientField | Field)[];
}) => T[];
//# sourceMappingURL=filterFieldsWithPermissions.d.ts.map