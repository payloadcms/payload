import { AllOperations } from '../types';
import type { SanitizedCollectionConfig } from '../collections/config/types';
import type { SanitizedGlobalConfig } from '../globals/config/types';
import type { PayloadRequest } from '../express/types';
import type { CollectionPermission, GlobalPermission } from '../auth/types';
type Args = {
    req: PayloadRequest;
    operations: AllOperations[];
    id?: string;
    type: 'collection' | 'global';
    entity: SanitizedCollectionConfig | SanitizedGlobalConfig;
};
type ReturnType<T extends Args> = T['type'] extends 'global' ? [GlobalPermission, Promise<void>[]] : [CollectionPermission, Promise<void>[]];
export declare function getEntityPolicies<T extends Args>(args: T): ReturnType<T>;
export {};
