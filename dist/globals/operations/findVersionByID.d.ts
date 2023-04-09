import { PayloadRequest } from '../../express/types';
import { TypeWithVersion } from '../../versions/types';
import { SanitizedGlobalConfig } from '../config/types';
export type Arguments = {
    globalConfig: SanitizedGlobalConfig;
    id: string | number;
    req: PayloadRequest;
    disableErrors?: boolean;
    currentDepth?: number;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
    depth?: number;
};
declare function findVersionByID<T extends TypeWithVersion<T> = any>(args: Arguments): Promise<T>;
export default findVersionByID;
