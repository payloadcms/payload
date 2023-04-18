import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { Permissions } from '../types';
export default function accessRequestHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Permissions> | void>;
