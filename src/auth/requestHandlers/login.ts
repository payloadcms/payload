import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';

export default async function loginHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const result = await this.operations.collections.auth.login({
      req,
      res,
      collection: req.collection,
      data: req.body,
      depth: req.query.depth,
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Auth Passed',
        user: result.user,
        token: result.token,
        exp: result.exp,
      });
  } catch (error) {
    return next(error);
  }
}
