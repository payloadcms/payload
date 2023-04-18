import { Collection } from '../collections/config/types';
import { SanitizedConfig } from '../config/types';
import { PayloadRequest } from '../express/types';
import { FileToSave } from './types';
type Args<T> = {
    config: SanitizedConfig;
    collection: Collection;
    throwOnMissingFile?: boolean;
    req: PayloadRequest;
    data: T;
    overwriteExistingFiles?: boolean;
};
type Result<T> = Promise<{
    data: T;
    files: FileToSave[];
}>;
export declare const generateFileData: <T>({ config, collection: { config: collectionConfig, Model, }, req, data, throwOnMissingFile, overwriteExistingFiles, }: Args<T>) => Result<T>;
export {};
