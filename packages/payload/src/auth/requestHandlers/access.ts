import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Permissions } from '../types';
import access from '../operations/access';

export default async function accessRequestHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Permissions> | void> {
  try {
    const accessResults = await access({
      req,
    });

    return res.status(httpStatus.OK)
      .json(accessResults);
  } catch (error) {
    return next(error);
  }
}
