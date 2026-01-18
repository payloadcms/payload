import type { PayloadRequest, Where } from '../../types/index.js';
import { type GlobalSlug, type SanitizedGlobalConfig } from '../../index.js';
export type Arguments = {
    disableErrors?: boolean;
    global: SanitizedGlobalConfig;
    overrideAccess?: boolean;
    req?: PayloadRequest;
    where?: Where;
};
export declare const countGlobalVersionsOperation: <TSlug extends GlobalSlug>(args: Arguments) => Promise<{
    totalDocs: number;
}>;
//# sourceMappingURL=countGlobalVersions.d.ts.map