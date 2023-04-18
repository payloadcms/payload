import { Response } from 'express';
import { Document, Where } from '../../../types';
import { SanitizedGlobalConfig } from '../../config/types';
import { PayloadRequest } from '../../../express/types';
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
}) => Promise<Document>;
export default function findVersionsResolver(globalConfig: SanitizedGlobalConfig): Resolver;
