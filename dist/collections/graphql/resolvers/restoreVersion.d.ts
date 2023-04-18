import { Response } from 'express';
import { Collection } from '../../config/types';
import { PayloadRequest } from '../../../express/types';
export type Resolver = (_: unknown, args: {
    id: string | number;
}, context: {
    req: PayloadRequest;
    res: Response;
}) => Promise<Document>;
export default function restoreVersionResolver(collection: Collection): Resolver;
