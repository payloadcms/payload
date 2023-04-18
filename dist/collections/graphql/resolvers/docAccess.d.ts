import { CollectionPermission, GlobalPermission } from '../../../auth';
import { PayloadRequest } from '../../../express/types';
export type Resolver = (_: unknown, args: {
    id: string | number;
}, context: {
    req: PayloadRequest;
    res: Response;
}) => Promise<CollectionPermission | GlobalPermission>;
export declare function docAccessResolver(): Resolver;
