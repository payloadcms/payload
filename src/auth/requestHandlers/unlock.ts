import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';

export default async function unlockHandler(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    await this.operations.collections.auth.unlock({
      req,
      collection: req.collection,
      data: { email: req.body.email },
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Success',
      });
  } catch (error) {
    return next(error);
  }
}
