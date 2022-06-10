import { NextFunction, Response } from 'express';
import { PayloadRequest } from '../../express/types';
import me from '../operations/me';

export default async function meHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const response = await me({
      req,
      collection: req.collection,
    });
    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
}
