import { NextFunction, Response } from 'express';
import { PayloadRequest } from '../../express/types';
export default function deleteHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<any> | void>;
