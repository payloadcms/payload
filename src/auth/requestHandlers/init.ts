import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types/payloadRequest';

export default async function initHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const initialized = await this.operations.collections.auth.init({ Model: req.collection.Model });
    return res.status(200).json({ initialized });
  } catch (error) {
    return next(error);
  }
}
