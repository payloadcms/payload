import type { ClientComponentProps, ClientField, FieldPaths, SanitizedFieldPermissions } from 'payload';
import React from 'react';
type RenderFieldProps = {
    clientFieldConfig: ClientField;
    permissions: SanitizedFieldPermissions;
} & FieldPaths & Pick<ClientComponentProps, 'forceRender' | 'readOnly' | 'schemaPath'>;
export declare function RenderField({ clientFieldConfig, forceRender, indexPath, parentPath, parentSchemaPath, path, permissions, readOnly, schemaPath, }: RenderFieldProps): string | number | bigint | true | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode>> | React.JSX.Element;
export {};
//# sourceMappingURL=RenderField.d.ts.map