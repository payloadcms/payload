import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { SanitizedGlobalConfig } from '../config/types';
import { Document } from '../../types';
export type UpdateGlobalResult = Promise<Response<Document> | void>;
export type UpdateGlobalResponse = (req: PayloadRequest, res: Response, next: NextFunction) => UpdateGlobalResult;
export default function updateHandler(globalConfig: SanitizedGlobalConfig): UpdateGlobalResponse;
