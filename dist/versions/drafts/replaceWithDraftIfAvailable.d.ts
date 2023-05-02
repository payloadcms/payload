import { Payload } from '../../payload';
import { PayloadRequest } from '../../types';
import { AccessResult } from '../../config/types';
import { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types';
import { SanitizedGlobalConfig } from '../../globals/config/types';
type Arguments<T> = {
    payload: Payload;
    entity: SanitizedCollectionConfig | SanitizedGlobalConfig;
    entityType: 'collection' | 'global';
    doc: T;
    req: PayloadRequest;
    overrideAccess: boolean;
    accessResult: AccessResult;
};
declare const replaceWithDraftIfAvailable: <T extends TypeWithID>({ payload, entity, entityType, doc, req, overrideAccess, accessResult, }: Arguments<T>) => Promise<T>;
export default replaceWithDraftIfAvailable;
