import type { I18nClient } from '@payloadcms/translations';
import { type ClientFieldSchemaMap, type Field, type FieldDiffClientProps, type FieldDiffServerProps, type FieldTypes, type PayloadComponent, type PayloadRequest, type SanitizedFieldsPermissions, type VersionField } from 'payload';
export type BuildVersionFieldsArgs = {
    clientSchemaMap: ClientFieldSchemaMap;
    customDiffComponents: Partial<Record<FieldTypes, PayloadComponent<FieldDiffServerProps, FieldDiffClientProps>>>;
    entitySlug: string;
    fields: Field[];
    fieldsPermissions: SanitizedFieldsPermissions;
    i18n: I18nClient;
    modifiedOnly: boolean;
    nestingLevel?: number;
    parentIndexPath: string;
    parentIsLocalized: boolean;
    parentPath: string;
    parentSchemaPath: string;
    req: PayloadRequest;
    selectedLocales: string[];
    versionFromSiblingData: object;
    versionToSiblingData: object;
};
/**
 * Build up an object that contains rendered diff components for each field.
 * This is then sent to the client to be rendered.
 *
 * Here, the server is responsible for traversing through the document data and building up this
 * version state object.
 */
export declare const buildVersionFields: ({ clientSchemaMap, customDiffComponents, entitySlug, fields, fieldsPermissions, i18n, modifiedOnly, nestingLevel, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, req, selectedLocales, versionFromSiblingData, versionToSiblingData, }: BuildVersionFieldsArgs) => {
    versionFields: VersionField[];
};
//# sourceMappingURL=buildVersionFields.d.ts.map