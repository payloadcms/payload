import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
export default function unlockHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any>;
