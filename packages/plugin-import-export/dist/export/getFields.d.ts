import type { Config, Field } from 'payload';
type GetFieldsOptions = {
    /**
     * Force a specific format, hiding the format dropdown
     */
    format?: 'csv' | 'json';
};
export declare const getFields: (config: Config, options?: GetFieldsOptions) => Field[];
export {};
//# sourceMappingURL=getFields.d.ts.map