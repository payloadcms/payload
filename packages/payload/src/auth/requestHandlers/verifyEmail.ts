import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types.js';
import verifyEmail from '../operations/verifyEmail.js';

async function verifyEmailHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    await verifyEmail({
      req,
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
