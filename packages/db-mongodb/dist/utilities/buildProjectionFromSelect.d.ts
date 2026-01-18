import type { FlattenedField, SelectType } from 'payload';
import type { MongooseAdapter } from '../index.js';
export declare const buildProjectionFromSelect: ({ adapter, fields, select, }: {
    adapter: MongooseAdapter;
    fields: FlattenedField[];
    select?: SelectType;
}) => Record<string, true> | undefined;
//# sourceMappingURL=buildProjectionFromSelect.d.ts.map