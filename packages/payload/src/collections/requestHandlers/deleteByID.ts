import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { NotFound } from '../../errors';
import { Document } from '../../types';
import deleteByID from '../operations/deleteByID';

export type DeleteResult = {
  message: string;
  doc: Document;
}

export default async function deleteByIDHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<DeleteResult> | void> {
  try {
    const doc = await deleteByID({
      req,
      collection: req.collection,
      id: req.params.id,
      depth: parseInt(String(req.query.depth), 10),
    });

    if (!doc) {
      return res.status(httpStatus.NOT_FOUND).json(new NotFound(req.t));
    }

    return res.status(httpStatus.OK).send(doc);
  } catch (error) {
    return next(error);
  }
}
