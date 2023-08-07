import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import init from '../operations/init';

export default async function initHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const initialized = await init({ Model: req.collection.Model, req });
    return res.status(200).json({ initialized });
  } catch (error) {
    return next(error);
  }
}
