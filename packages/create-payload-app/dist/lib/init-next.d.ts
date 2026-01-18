import type { CliArgs, DbType, NextAppDetails, PackageManager } from '../types.js';
type InitNextArgs = {
    dbType: DbType;
    nextAppDetails?: NextAppDetails;
    packageManager: PackageManager;
    projectDir: string;
    useDistFiles?: boolean;
} & Pick<CliArgs, '--debug'>;
type InitNextResult = {
    isSrcDir: boolean;
    nextAppDir?: string;
    reason: string;
    success: false;
} | {
    isSrcDir: boolean;
    nextAppDir: string;
    payloadConfigPath: string;
    success: true;
};
export declare function initNext(args: InitNextArgs): Promise<InitNextResult>;
export declare function getNextAppDetails(projectDir: string): Promise<NextAppDetails>;
export {};
//# sourceMappingURL=init-next.d.ts.map