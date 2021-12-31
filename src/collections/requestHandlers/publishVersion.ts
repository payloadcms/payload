import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
import formatSuccessResponse from '../../express/responses/formatSuccess';

export type RestoreResult = {
  message: string
  doc: Document
};

export default async function publishVersion(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<RestoreResult> | void> {
  const options = {
    req,
    collection: req.collection,
    id: req.params.id,
    depth: req.query.depth,
  };

  try {
    const doc = await this.operations.collections.publishVersion(options);
    return res.status(httpStatus.OK).json({
      ...formatSuccessResponse('Restored successfully.', 'message'),
      doc,
    });
  } catch (error) {
    return next(error);
  }
}
