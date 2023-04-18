import { Where } from '../../types';
import { PayloadRequest } from '../../express/types';
import { Collection } from '../config/types';
import { PaginatedDocs } from '../../mongoose/types';
import { TypeWithVersion } from '../../versions/types';
export type Arguments = {
    collection: Collection;
    where?: Where;
    page?: number;
    limit?: number;
    sort?: string;
    depth?: number;
    req?: PayloadRequest;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
};
declare function findVersions<T extends TypeWithVersion<T>>(args: Arguments): Promise<PaginatedDocs<T>>;
export default findVersions;
