import type { NextFunction, Response } from 'express';

import type { PayloadRequest } from '../../express/types.js';
import type { Document } from '../../types/index.js';

import findVersionByID from '../operations/findVersionByID.js';

export type FindByIDResult = {
  doc: Document;
  message: string;
};

export default async function findVersionByIDHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<FindByIDResult> | void> {
  const options = {
    collection: req.collection,
    depth: parseInt(String(req.query.depth), 10),
    id: req.params.id,
    payload: req.payload,
    req,
  };

  try {
    const doc = await findVersionByID(options);
    return res.json(doc);
  } catch (error) {
    return next(error);
  }
}
