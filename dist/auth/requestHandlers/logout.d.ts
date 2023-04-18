import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
export default function logoutHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<{
    message: string;
}> | void>;
