import { Response } from 'express';
import { SanitizedGlobalConfig } from '../../config/types';
import { Document } from '../../../types';
import { PayloadRequest } from '../../../express/types';
export type Resolver = (_: unknown, args: {
    id: string | number;
    locale?: string;
    draft?: boolean;
    fallbackLocale?: string;
}, context: {
    req: PayloadRequest;
    res: Response;
}) => Promise<Document>;
export default function findVersionByIDResolver(globalConfig: SanitizedGlobalConfig): Resolver;
