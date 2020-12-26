import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';

export type FindByIDResult = {
  message: string;
  doc: Document;
};

export default async function findByID(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<FindByIDResult> | void> {
  const options = {
    req,
    collection: req.collection,
    id: req.params.id,
    depth: req.query.depth,
  };

  try {
    const doc = await this.operations.collections.findByID(options);
    return res.json(doc);
  } catch (error) {
    return next(error);
  }
}
