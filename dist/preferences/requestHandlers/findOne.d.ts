import { NextFunction, Response } from 'express';
import { PayloadRequest } from '../../express/types';
import { Preference } from '../types';
export default function findOneHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Preference> | void>;
