import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
import { SanitizedGlobalConfig } from '../config/types';
export default function restoreVersionHandler(globalConfig: SanitizedGlobalConfig): (req: PayloadRequest, res: Response, next: NextFunction) => Promise<Response<Document> | void>;
