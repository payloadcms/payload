import type { Data, FormState } from 'payload';
type ReturnType = {
    data: Data;
    valid: boolean;
};
/**
 * Reduce flattened form fields (Fields) to just map to the respective values instead of the full FormField object
 *
 * @param unflatten This also unflattens the data if `unflatten` is true. The unflattened data should match the original data structure
 * @param ignoreDisableFormData - if true, will include fields that have `disableFormData` set to true, for example, blocks or arrays fields.
 *
 */
export declare const reduceFieldsToValuesWithValidation: (fields: FormState, unflatten?: boolean, ignoreDisableFormData?: boolean) => ReturnType;
export {};
//# sourceMappingURL=reduceFieldsToValuesWithValidation.d.ts.map