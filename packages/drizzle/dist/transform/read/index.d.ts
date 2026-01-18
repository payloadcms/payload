import type { FlattenedField, JoinQuery, SanitizedConfig, TypeWithID } from 'payload';
import type { DrizzleAdapter } from '../../types.js';
type TransformArgs = {
    adapter: DrizzleAdapter;
    config: SanitizedConfig;
    data: Record<string, unknown>;
    fallbackLocale?: false | string;
    fields: FlattenedField[];
    joinQuery?: JoinQuery;
    locale?: string;
    parentIsLocalized?: boolean;
    tableName: string;
};
export declare const transform: <T extends Record<string, unknown> | TypeWithID>({ adapter, config, data, fields, joinQuery, parentIsLocalized, tableName, }: TransformArgs) => T;
export {};
//# sourceMappingURL=index.d.ts.map