import { CollectionPermission, GlobalPermission } from '../../../auth';
import { PayloadRequest } from '../../../express/types';
import { SanitizedGlobalConfig } from '../../config/types';
export type Resolver = (_: unknown, context: {
    req: PayloadRequest;
    res: Response;
}) => Promise<CollectionPermission | GlobalPermission>;
export declare function docAccessResolver(global: SanitizedGlobalConfig): Resolver;
