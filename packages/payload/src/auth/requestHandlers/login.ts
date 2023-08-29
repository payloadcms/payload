import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types.js';
import login, { Result } from '../operations/login.js';

export default async function loginHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Result & { message: string }> | void> {
  try {
    const result = await login({
      req,
      res,
      collection: req.collection,
      data: req.body,
      depth: parseInt(String(req.query.depth), 10),
    });

    res.status(httpStatus.OK)
      .json({
        message: 'Auth Passed',
        user: result.user,
        token: result.token,
        exp: result.exp,
      });
  } catch (error) {
    next(error);
  }
}
