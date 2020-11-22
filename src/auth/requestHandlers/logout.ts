import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types/payloadRequest';

export default async function logoutHandler(req: PayloadRequest, res: Response, next: NextFunction) {
  try {
    const message = await this.operations.collections.auth.logout({
      collection: req.collection,
      res,
      req,
    });

    return res.status(200).json({ message });
  } catch (error) {
    return next(error);
  }
}
