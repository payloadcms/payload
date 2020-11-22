import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types/payloadRequest';

async function verifyEmail(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    await this.operations.collections.auth.verifyEmail({
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

export default verifyEmail;
