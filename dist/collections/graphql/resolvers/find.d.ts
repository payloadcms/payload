import { PayloadRequest } from '../../../express/types';
import type { PaginatedDocs } from '../../../mongoose/types';
import { Where } from '../../../types';
import { Collection } from '../../config/types';
export type Resolver = (_: unknown, args: {
    data: Record<string, unknown>;
    locale?: string;
    draft: boolean;
    where?: Where;
    limit?: number;
    page?: number;
    sort?: string;
    fallbackLocale?: string;
}, context: {
    req: PayloadRequest;
    res: Response;
}) => Promise<PaginatedDocs<any>>;
export default function findResolver(collection: Collection): Resolver;
