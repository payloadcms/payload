import { Request, Response, NextFunction } from 'express';
import getExtractJWT from '../getExtractJWT';

export default async function refreshHandler(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const extractJWT = getExtractJWT(this.config);
    const token = extractJWT(req);

    const result = await this.operations.collections.auth.refresh({
      req,
      res,
      collection: req.collection,
      token,
    });

    return res.status(200).json({
      message: 'Token refresh successful',
      ...result,
    });
  } catch (error) {
    return next(error);
  }
}
