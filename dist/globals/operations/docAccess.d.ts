import { GlobalPermission } from '../../auth';
import type { PayloadRequest } from '../../express/types';
import { SanitizedGlobalConfig } from '../config/types';
type Arguments = {
    req: PayloadRequest;
    globalConfig: SanitizedGlobalConfig;
};
export declare function docAccess(args: Arguments): Promise<GlobalPermission>;
export {};
