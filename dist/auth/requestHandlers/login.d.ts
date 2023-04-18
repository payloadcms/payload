import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { Result } from '../operations/login';
export default function loginHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Result & {
    message: string;
}> | void>;
