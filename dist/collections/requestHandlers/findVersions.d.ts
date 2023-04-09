import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { TypeWithID } from '../config/types';
import { PaginatedDocs } from '../../mongoose/types';
export default function findVersionsHandler<T extends TypeWithID = any>(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<PaginatedDocs<T>> | void>;
