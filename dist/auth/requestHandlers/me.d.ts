import { NextFunction, Response } from 'express';
import { PayloadRequest } from '../../express/types';
export default function meHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any>;
