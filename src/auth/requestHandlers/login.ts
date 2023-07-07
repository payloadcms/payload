import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import login, { Result } from '../operations/login';

export default async function loginHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Result & { message: string }> | void> {
  try {
    await req.payload.db.beginTransaction();
    const result = await login({
      req,
      res,
      collection: req.collection,
      data: req.body,
      depth: parseInt(String(req.query.depth), 10),
    });
    await req.payload.db.commitTransaction();

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
