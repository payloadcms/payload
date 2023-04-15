import { AccessResult } from '../../config/types';
import { Where } from '../../types';
import { Payload } from '../..';
import { PaginatedDocs } from '../../mongoose/types';
import { Collection, TypeWithID } from '../../collections/config/types';
type Args = {
    accessResult: AccessResult;
    collection: Collection;
    locale: string;
    paginationOptions: any;
    payload: Payload;
    query: Record<string, unknown>;
    where: Where;
};
export declare const mergeDrafts: <T extends TypeWithID>({ accessResult, collection, locale, payload, paginationOptions, query, where: incomingWhere, }: Args) => Promise<PaginatedDocs<T>>;
export {};
