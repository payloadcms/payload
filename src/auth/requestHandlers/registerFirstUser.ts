
import { Request, Response, NextFunction } from 'express';

export default async function registerFirstUser(req: Request, res: Response, next: NextFunction): Promise<any> {
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
