import { Response } from 'express';
import { Where } from '../../../types';
import type { PaginatedDocs } from '../../../mongoose/types';
import { PayloadRequest } from '../../../express/types';
import { Collection } from '../../config/types';
export type Resolver = (_: unknown, args: {
    locale?: string;
    fallbackLocale?: string;
    where: Where;
    limit?: number;
    page?: number;
    sort?: string;
}, context: {
    req: PayloadRequest;
    res: Response;
}) => Promise<PaginatedDocs<any>>;
export default function findVersionsResolver(collection: Collection): Resolver;
