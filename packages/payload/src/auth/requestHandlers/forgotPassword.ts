import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import forgotPassword from '../operations/forgotPassword';

export default async function forgotPasswordHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    await forgotPassword({
      req,
      collection: req.collection,
      data: { email: req.body.email },
      disableEmail: req.body.disableEmail,
      expiration: req.body.expiration,
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Success',
      });
  } catch (error) {
    return next(error);
  }
}
