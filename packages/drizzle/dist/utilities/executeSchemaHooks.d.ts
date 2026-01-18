import type { DrizzleAdapter } from '../types.js';
import { extendDrizzleTable } from './extendDrizzleTable.js';
type DatabaseSchema = {
    enums?: DrizzleAdapter['enums'];
    relations: Record<string, any>;
    tables: DrizzleAdapter['tables'];
};
type Adapter = {
    afterSchemaInit: DatabaseSchemaHook[];
    beforeSchemaInit: DatabaseSchemaHook[];
} & DatabaseSchema;
type DatabaseSchemaHookArgs = {
    adapter: Record<string, unknown>;
    extendTable: typeof extendDrizzleTable;
    schema: DatabaseSchema;
};
type DatabaseSchemaHook = (args: DatabaseSchemaHookArgs) => DatabaseSchema | Promise<DatabaseSchema>;
type Args = {
    adapter: Adapter;
    type: 'afterSchemaInit' | 'beforeSchemaInit';
};
export declare const executeSchemaHooks: ({ type, adapter }: Args) => Promise<void>;
export {};
//# sourceMappingURL=executeSchemaHooks.d.ts.map