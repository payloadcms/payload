import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';

export default async function policiesHandler(req: Request, res: Response, next: NextFunction): Promise<any> {
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
