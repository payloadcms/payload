import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { TypeWithID } from '../../collections/config/types';
import { PaginatedDocs } from '../../mongoose/types';
import { SanitizedGlobalConfig } from '../config/types';
export default function findVersionsHandler(global: SanitizedGlobalConfig): <T extends TypeWithID = any>(req: PayloadRequest, res: Response, next: NextFunction) => Promise<void | Response<PaginatedDocs<T>, Record<string, any>>>;
