import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
import findVersionByID from '../operations/findVersionByID';

export type FindByIDResult = {
  message: string;
  doc: Document;
};

export default async function findVersionByIDHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<FindByIDResult> | void> {
  const options = {
    req,
    collection: req.collection,
    id: req.params.id,
    payload: req.payload,
    depth: parseInt(String(req.query.depth), 10),
  };

  try {
    const doc = await findVersionByID(options);
    return res.json(doc);
  } catch (error) {
    return next(error);
  }
}
