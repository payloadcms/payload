import type { NextFunction, Response } from 'express';

import type { PayloadRequest } from '../../express/types.js';

import init from '../operations/init.js';

export default async function initHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const initialized = await init({
      collection: req.collection.config.slug,
      req,
    });
    return res.status(200).json({ initialized });
  } catch (error) {
    return next(error);
  }
}
