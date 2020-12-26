import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';

export default async function unlockHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    await this.operations.collections.auth.unlock({
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
