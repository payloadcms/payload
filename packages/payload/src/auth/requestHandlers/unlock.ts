import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import unlock from '../operations/unlock';

export default async function unlockHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    await unlock({
      req,
      collection: req.collection,
      data: { email: req.body.email },
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Success',
      });
  } catch (error) {
    return next(error);
  }
}
