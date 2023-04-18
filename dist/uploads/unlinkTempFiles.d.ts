import type { PayloadRequest } from '../express/types';
import type { SanitizedConfig } from '../config/types';
import type { SanitizedCollectionConfig } from '../collections/config/types';
type Args = {
    req: PayloadRequest;
    config: SanitizedConfig;
    collectionConfig: SanitizedCollectionConfig;
};
/**
 * Remove temp files if enabled, as express-fileupload does not do this automatically
 */
export declare const unlinkTempFiles: (args: Args) => Promise<void>;
export {};
