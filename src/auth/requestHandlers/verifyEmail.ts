import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import verifyEmail from '../operations/verifyEmail';

async function verifyEmailHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    await req.payload.db.beginTransaction();
    await verifyEmail({
      req,
      collection: req.collection,
      token: req.params.token,
    });
    await req.payload.db.commitTransaction();

    return res.status(httpStatus.OK)
      .json({
        message: 'Email verified successfully.',
      });
  } catch (error) {
    return next(error);
  }
}

export default verifyEmailHandler;
