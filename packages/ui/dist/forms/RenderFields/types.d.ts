import type { ClientComponentProps, ClientField, SanitizedFieldPermissions } from 'payload';
export type RenderFieldsProps = {
    readonly className?: string;
    readonly fields: ClientField[];
    readonly margins?: 'small' | false;
    readonly parentIndexPath: string;
    readonly parentPath: string;
    readonly parentSchemaPath: string;
    readonly permissions: {
        [fieldName: string]: SanitizedFieldPermissions;
    } | SanitizedFieldPermissions;
    readonly readOnly?: boolean;
} & Pick<ClientComponentProps, 'forceRender'>;
//# sourceMappingURL=types.d.ts.map