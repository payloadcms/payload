import { Request, Response, NextFunction } from 'express';

export default async function initHandler(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const initialized = await this.operations.collections.auth.init({ Model: req.collection.Model });
    return res.status(200).json({ initialized });
  } catch (error) {
    return next(error);
  }
}
