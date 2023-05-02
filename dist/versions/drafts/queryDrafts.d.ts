import { PaginateOptions } from 'mongoose';
import { AccessResult } from '../../config/types';
import { PayloadRequest, Where } from '../../types';
import { Payload } from '../../payload';
import { PaginatedDocs } from '../../mongoose/types';
import { Collection, TypeWithID } from '../../collections/config/types';
type Args = {
    accessResult: AccessResult;
    collection: Collection;
    req: PayloadRequest;
    overrideAccess: boolean;
    paginationOptions?: PaginateOptions;
    payload: Payload;
    where: Where;
};
export declare const queryDrafts: <T extends TypeWithID>({ accessResult, collection, req, overrideAccess, payload, paginationOptions, where: incomingWhere, }: Args) => Promise<PaginatedDocs<T>>;
export {};
