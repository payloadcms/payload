import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import forgotPassword from '../operations/forgotPassword';

export default async function forgotPasswordHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    await req.payload.db.beginTransaction();
    await forgotPassword({
      req,
      collection: req.collection,
      data: { email: req.body.email },
      disableEmail: req.body.disableEmail,
      expiration: req.body.expiration,
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
