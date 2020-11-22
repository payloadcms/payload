import { NextFunction, Request, Response } from 'express';

export default async function me(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const response = await this.operations.collections.auth.me({ req });
    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
}
