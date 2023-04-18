import { PayloadRequest } from '../../express/types';
import { Collection } from '../config/types';
import { TypeWithVersion } from '../../versions/types';
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
declare function findVersionByID<T extends TypeWithVersion<T> = any>(args: Arguments): Promise<T>;
export default findVersionByID;
