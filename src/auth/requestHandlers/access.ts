import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Permissions } from '../types';

export type AccessRequestHandler = (req: PayloadRequest, res: Response, next: NextFunction) => unknown;

export default async function accessRequestHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Permissions> | void> {
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
