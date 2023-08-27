import { NextFunction, Response } from 'express';
import { PayloadRequest } from '../../express/types.js';
import registerFirstUser from '../operations/registerFirstUser.js';

export default async function registerFirstUserHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const firstUser = await registerFirstUser({
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
