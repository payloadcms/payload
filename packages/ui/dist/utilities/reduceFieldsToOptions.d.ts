import type { I18nClient } from '@payloadcms/translations';
import type { ClientField, SanitizedFieldPermissions, SanitizedFieldsPermissions } from 'payload';
import type { ReducedField } from '../elements/WhereBuilder/types.js';
type ReduceFieldOptionsArgs = {
    fieldPermissions?: SanitizedFieldPermissions | SanitizedFieldsPermissions;
    fields: ClientField[];
    i18n: I18nClient;
    labelPrefix?: string;
    pathPrefix?: string;
};
/**
 * Transforms a fields schema into a flattened array of fields with labels and values.
 * Used in the `WhereBuilder` component to render the fields in the dropdown.
 */
export declare const reduceFieldsToOptions: ({ fieldPermissions, fields, i18n, labelPrefix, pathPrefix: pathPrefixFromArgs, }: ReduceFieldOptionsArgs) => ReducedField[];
export {};
//# sourceMappingURL=reduceFieldsToOptions.d.ts.map