import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { CollectionPermission, GlobalPermission } from '../../auth';
export default function docAccessRequestHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<CollectionPermission | GlobalPermission> | void>;
