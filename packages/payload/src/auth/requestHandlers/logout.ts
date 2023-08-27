import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types.js';
import logout from '../operations/logout.js';

export default async function logoutHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<{ message: string }> | void> {
  try {
    const message = await logout({
      collection: req.collection,
      res,
      req,
    });

    return res.status(httpStatus.OK).json({ message });
  } catch (error) {
    return next(error);
  }
}
