import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types.js';
import { NotFound } from '../../errors/index.js';
import { Document } from '../../types/index.js';
import deleteByID from '../operations/deleteByID.js';

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
      res.status(httpStatus.NOT_FOUND)
        .json(new NotFound(req.t));
    }

    res.status(httpStatus.OK)
      .send(doc);
  } catch (error) {
    next(error);
  }
}
