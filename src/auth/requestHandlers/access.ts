import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types/payloadRequest';

export default async function policiesHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const accessResults = await this.operations.collections.auth.access({
      req,
    });

    return res.status(httpStatus.OK)
      .json(accessResults);
  } catch (error) {
    return next(error);
  }
}
