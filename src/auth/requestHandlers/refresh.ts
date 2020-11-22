import { Response, NextFunction } from 'express';
import getExtractJWT from '../getExtractJWT';
import { PayloadRequest } from '../../express/types/payloadRequest';

export default async function refreshHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
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
