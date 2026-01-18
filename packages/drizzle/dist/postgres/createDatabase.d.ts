import type { BasePostgresAdapter } from './types.js';
type Args = {
    /**
     * Name of a database, defaults to the current one
     */
    name?: string;
    /**
     * Schema to create in addition to 'public'. Defaults to adapter.schemaName if exists.
     */
    schemaName?: string;
};
export declare const createDatabase: (this: BasePostgresAdapter, args?: Args) => Promise<boolean>;
export {};
//# sourceMappingURL=createDatabase.d.ts.map