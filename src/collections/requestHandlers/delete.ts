import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types/payloadRequest';
import { NotFound } from '../../errors';
import { Document } from '../../types';

export type DeleteRequestHandler = (req: PayloadRequest, res: Response, next: NextFunction) => unknown;

export type DeleteResult = {
  message: string;
  doc: Document;
}

export default async function deleteHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<DeleteResult> | void> {
  try {
    const doc = await this.operations.collections.delete({
      req,
      collection: req.collection,
      id: req.params.id,
      depth: req.query.depth,
    });

    if (!doc) {
      return res.status(httpStatus.NOT_FOUND).json(new NotFound());
    }

    return res.status(httpStatus.OK).send(doc);
  } catch (error) {
    return next(error);
  }
}
