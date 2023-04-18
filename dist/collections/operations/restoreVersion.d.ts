import { PayloadRequest } from '../../express/types';
import { Collection, TypeWithID } from '../config/types';
export type Arguments = {
    collection: Collection;
    id: string | number;
    req: PayloadRequest;
    disableErrors?: boolean;
    currentDepth?: number;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
    depth?: number;
};
declare function restoreVersion<T extends TypeWithID = any>(args: Arguments): Promise<T>;
export default restoreVersion;
