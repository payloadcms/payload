import type { DbType, StorageAdapterType } from '../types.js';
/** Update payload config with necessary imports and adapters */
export declare function configurePayloadConfig(args: {
    dbType?: DbType;
    envNames?: {
        dbUri: string;
    };
    packageJsonName?: string;
    projectDirOrConfigPath: {
        payloadConfigPath: string;
    } | {
        projectDir: string;
    };
    sharp?: boolean;
    storageAdapter?: StorageAdapterType;
}): Promise<void>;
//# sourceMappingURL=configure-payload-config.d.ts.map