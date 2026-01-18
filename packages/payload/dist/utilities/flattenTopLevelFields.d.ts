import type { I18nClient } from '@payloadcms/translations';
import type { ClientField } from '../fields/config/client.js';
import type { Field, FieldAffectingData, FieldAffectingDataClient, FieldPresentationalOnly, FieldPresentationalOnlyClient } from '../fields/config/types.js';
type FlattenedField<TField> = TField extends ClientField ? {
    accessor?: string;
    labelWithPrefix?: string;
} & (FieldAffectingDataClient | FieldPresentationalOnlyClient) : {
    accessor?: string;
    labelWithPrefix?: string;
} & (FieldAffectingData | FieldPresentationalOnly);
/**
 * Options to control how fields are flattened.
 */
type FlattenFieldsOptions = {
    /**
     * i18n context used for translating `label` values via `getTranslation`.
     */
    i18n?: I18nClient;
    /**
     * If true, presentational-only fields (like UI fields) will be included
     * in the output. Otherwise, they will be skipped.
     * Default: false.
     */
    keepPresentationalFields?: boolean;
    /**
     * A label prefix to prepend to translated labels when building `labelWithPrefix`.
     * Used recursively when flattening nested fields.
     */
    labelPrefix?: string;
    /**
     * If true, nested fields inside `group` & `tabs` fields will be lifted to the top level
     * and given contextual `accessor` and `labelWithPrefix` values.
     * Default: false.
     */
    moveSubFieldsToTop?: boolean;
    /**
     * A path prefix to prepend to field names when building the `accessor`.
     * Used recursively when flattening nested fields.
     */
    pathPrefix?: string;
};
/**
 * Flattens a collection's fields into a single array of fields, optionally
 * extracting nested fields in group fields.
 *
 * @param fields - Array of fields to flatten
 * @param options - Options to control the flattening behavior
 */
export declare function flattenTopLevelFields<TField extends ClientField | Field>(fields?: TField[], options?: boolean | FlattenFieldsOptions): FlattenedField<TField>[];
export {};
//# sourceMappingURL=flattenTopLevelFields.d.ts.map