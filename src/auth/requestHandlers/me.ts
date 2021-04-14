import { NextFunction, Response } from 'express';
import { PayloadRequest } from '../../express/types';

export default async function me(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const collectionSlug = req.route.path.split('/').filter((r) => r !== '')[0];
    const response = await this.operations.collections.auth.me({
      req,
      collectionSlug,
    });
    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
}
