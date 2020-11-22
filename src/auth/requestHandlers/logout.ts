import { Request, Response, NextFunction } from 'express';

export default async function logoutHandler(req: Request, res: Response, next: NextFunction) {
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
