import type { CliArgs, DbType, ProjectTemplate } from '../types.js';
/** Parse and swap .env.example values and write .env */
export declare function manageEnvFiles(args: {
    cliArgs: CliArgs;
    databaseType?: DbType;
    databaseUri?: string;
    payloadSecret: string;
    projectDir: string;
    template?: ProjectTemplate;
}): Promise<void>;
//# sourceMappingURL=manage-env-files.d.ts.map