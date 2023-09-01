import type { NextFunction, Response } from 'express';

import httpStatus from 'http-status';

import type { PayloadRequest } from '../../express/types';
import type { Document } from '../../types';

import { NotFound } from '../../errors';
import deleteByID from '../operations/deleteByID';

export type DeleteResult = {
  doc: Document;
  message: string;
}

export default async function deleteByIDHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<DeleteResult> | void> {
  try {
    const doc = await deleteByID({
      collection: req.collection,
      depth: parseInt(String(req.query.depth), 10),
      id: req.params.id,
      req,
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
