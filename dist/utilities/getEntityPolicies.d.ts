import { AllOperations } from '../types';
import type { CollectionConfig } from '../collections/config/types';
import type { GlobalConfig } from '../globals/config/types';
import type { PayloadRequest } from '../express/types';
import type { CollectionPermission, GlobalPermission } from '../auth/types';
type Args = ({
    req: PayloadRequest;
    operations: AllOperations[];
    id?: string;
} & ({
    type: 'collection';
    entity: CollectionConfig;
} | {
    type: 'global';
    entity: GlobalConfig;
}));
type ReturnType<T extends Args> = T['type'] extends 'global' ? [GlobalPermission, Promise<void>[]] : [CollectionPermission, Promise<void>[]];
export declare function getEntityPolicies<T extends Args>(args: T): ReturnType<T>;
export {};
