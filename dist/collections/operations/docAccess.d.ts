import { CollectionPermission } from '../../auth';
import type { PayloadRequest } from '../../express/types';
type Arguments = {
    req: PayloadRequest;
    id: string;
};
export declare function docAccess(args: Arguments): Promise<CollectionPermission>;
export {};
