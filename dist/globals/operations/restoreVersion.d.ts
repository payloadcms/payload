import { PayloadRequest } from '../../express/types';
import { TypeWithVersion } from '../../versions/types';
import { SanitizedGlobalConfig } from '../config/types';
export type Arguments = {
    globalConfig: SanitizedGlobalConfig;
    id: string | number;
    depth?: number;
    req?: PayloadRequest;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
};
declare function restoreVersion<T extends TypeWithVersion<T> = any>(args: Arguments): Promise<T>;
export default restoreVersion;
