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
    draft?: boolean;
};
declare function findByID<T extends TypeWithID>(incomingArgs: Arguments): Promise<T>;
export default findByID;
