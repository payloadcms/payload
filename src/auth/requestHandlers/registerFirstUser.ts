import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types/payloadRequest';

export default async function registerFirstUser(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const firstUser = await this.operations.collections.auth.registerFirstUser({
      req,
      res,
      collection: req.collection,
      data: req.body,
    });

    return res.status(201).json(firstUser);
  } catch (error) {
    return next(error);
  }
}
