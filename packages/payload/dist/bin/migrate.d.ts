import type { ParsedArgs } from 'minimist';
import type { SanitizedConfig } from '../config/types.js';
export declare const availableCommands: string[];
type Args = {
    config: SanitizedConfig;
    /**
     * Override the migration directory. Useful for testing when the CWD differs
     * from where the test config expects migrations to be stored.
     */
    migrationDir?: string;
    parsedArgs: ParsedArgs;
};
export declare const migrate: ({ config, migrationDir, parsedArgs }: Args) => Promise<void>;
export {};
//# sourceMappingURL=migrate.d.ts.map