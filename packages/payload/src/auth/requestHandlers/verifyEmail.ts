import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import verifyEmail from '../operations/verifyEmail';

async function verifyEmailHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    await verifyEmail({
      collection: req.collection,
      token: req.params.token,
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Email verified successfully.',
      });
  } catch (error) {
    return next(error);
  }
}

export default verifyEmailHandler;
