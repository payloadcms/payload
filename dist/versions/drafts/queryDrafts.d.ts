import { PaginateOptions } from 'mongoose';
import { AccessResult } from '../../config/types';
import { Where } from '../../types';
import { Payload } from '../../payload';
import { PaginatedDocs } from '../../mongoose/types';
import { Collection, TypeWithID } from '../../collections/config/types';
type Args = {
    accessResult: AccessResult;
    collection: Collection;
    locale: string;
    paginationOptions?: PaginateOptions;
    payload: Payload;
    where: Where;
};
export declare const queryDrafts: <T extends TypeWithID>({ accessResult, collection, locale, payload, paginationOptions, where: incomingWhere, }: Args) => Promise<PaginatedDocs<T>>;
export {};
