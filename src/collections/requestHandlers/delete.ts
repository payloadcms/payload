import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Document, Where } from '../../types';
import deleteOperation from '../operations/delete';

export type DeleteResult = {
  message: string;
  doc: Document;
}

export default async function deleteHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<DeleteResult> | void> {
  try {
    const docs = await deleteOperation({
      req,
      collection: req.collection,
      where: req.query.where as Where,
      depth: parseInt(String(req.query.depth), 10),
    });

    return res.status(httpStatus.OK).json({
      docs,
    });
  } catch (error) {
    return next(error);
  }
}
