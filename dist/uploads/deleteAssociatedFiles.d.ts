import type { TFunction } from 'i18next';
import type { FileToSave } from './types';
import type { SanitizedConfig } from '../config/types';
import type { SanitizedCollectionConfig } from '../collections/config/types';
type Args = {
    config: SanitizedConfig;
    collectionConfig: SanitizedCollectionConfig;
    files?: FileToSave[];
    doc: Record<string, unknown>;
    t: TFunction;
    overrideDelete: boolean;
};
export declare const deleteAssociatedFiles: (args: Args) => Promise<void>;
export {};
