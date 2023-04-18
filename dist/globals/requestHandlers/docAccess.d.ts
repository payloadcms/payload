import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { CollectionPermission, GlobalPermission } from '../../auth';
import { SanitizedGlobalConfig } from '../config/types';
export default function docAccessRequestHandler(req: PayloadRequest, res: Response, next: NextFunction, globalConfig: SanitizedGlobalConfig): Promise<Response<CollectionPermission | GlobalPermission> | void>;
