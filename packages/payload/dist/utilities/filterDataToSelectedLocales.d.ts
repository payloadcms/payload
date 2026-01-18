import type { Field } from '../fields/config/types.js';
import type { SanitizedConfig } from '../index.js';
import type { JsonObject } from '../types/index.js';
type FilterDataToSelectedLocalesArgs = {
    configBlockReferences: SanitizedConfig['blocks'];
    docWithLocales: JsonObject;
    fields: Field[];
    parentIsLocalized?: boolean;
    selectedLocales: string[];
};
/**
 * Filters localized field data to only include specified locales.
 * For non-localized fields, returns all data as-is.
 * For localized fields, if selectedLocales is provided, returns only those locales.
 * If selectedLocales is not provided and field is localized, returns all locales.
 */
export declare function filterDataToSelectedLocales({ configBlockReferences, docWithLocales, fields, parentIsLocalized, selectedLocales, }: FilterDataToSelectedLocalesArgs): JsonObject;
export {};
//# sourceMappingURL=filterDataToSelectedLocales.d.ts.map