import type { ArrayFieldClient, BlocksFieldClient, ClientConfig, ClientField } from 'payload';
type Args = {
    config: ClientConfig;
    fields: ClientField[];
    locales: string[] | undefined;
    parentIsLocalized: boolean;
    valueFrom: unknown;
    valueTo: unknown;
};
/**
 * Recursively counts the number of changed fields between comparison and
 * version data for a given set of fields.
 */
export declare function countChangedFields({ config, fields, locales, parentIsLocalized, valueFrom, valueTo, }: Args): number;
type countChangedFieldsInRowsArgs = {
    config: ClientConfig;
    field: ArrayFieldClient | BlocksFieldClient;
    locales: string[] | undefined;
    parentIsLocalized: boolean;
    valueFromRows: unknown[];
    valueToRows: unknown[];
};
export declare function countChangedFieldsInRows({ config, field, locales, parentIsLocalized, valueFromRows, valueToRows, }: countChangedFieldsInRowsArgs): number;
export {};
//# sourceMappingURL=countChangedFields.d.ts.map