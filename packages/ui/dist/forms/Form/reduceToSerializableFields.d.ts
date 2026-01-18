import { type FormField, type FormState } from 'payload';
type BlacklistedKeys = 'customComponents' | 'validate';
/**
 * Takes in FormState and removes fields that are not serializable.
 * Returns FormState without blacklisted keys.
 */
export declare const reduceToSerializableFields: (fields: FormState) => {
    [key: string]: Omit<FormField, BlacklistedKeys>;
};
export {};
//# sourceMappingURL=reduceToSerializableFields.d.ts.map