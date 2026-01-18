import type { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types.js';
import type { AccessResult } from '../../config/types.js';
import type { SanitizedGlobalConfig } from '../../globals/config/types.js';
import type { PayloadRequest, SelectType } from '../../types/index.js';
type Arguments<T> = {
    accessResult: AccessResult;
    doc: T;
    entity: SanitizedCollectionConfig | SanitizedGlobalConfig;
    entityType: 'collection' | 'global';
    overrideAccess: boolean;
    req: PayloadRequest;
    select?: SelectType;
};
export declare const replaceWithDraftIfAvailable: <T extends TypeWithID>({ accessResult, doc, entity, entityType, req, select, }: Arguments<T>) => Promise<T>;
export {};
//# sourceMappingURL=replaceWithDraftIfAvailable.d.ts.map