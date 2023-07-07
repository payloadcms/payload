import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import unlock from '../operations/unlock';

export default async function unlockHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    await req.payload.db.beginTransaction();
    await unlock({
      req,
      collection: req.collection,
      data: { email: req.body.email },
    });
    await req.payload.db.commitTransaction();

    return res.status(httpStatus.OK)
      .json({
        message: 'Success',
      });
  } catch (error) {
    return next(error);
  }
}
