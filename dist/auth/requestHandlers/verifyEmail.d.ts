import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
declare function verifyEmailHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any>;
export default verifyEmailHandler;
