import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
import formatSuccessResponse from '../../express/responses/formatSuccess';
import restoreVersion from '../operations/restoreVersion';

export type RestoreResult = {
  message: string
  doc: Document
};

export default async function restoreVersionHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<RestoreResult> | void> {
  const options = {
    req,
    collection: req.collection,
    id: req.params.id,
    depth: Number(req.query.depth),
    payload: req.payload,
  };

  try {
    await req.payload.db.beginTransaction();
    const doc = await restoreVersion(options);
    await req.payload.db.commitTransaction();
    res.status(httpStatus.OK)
      .json({
        ...formatSuccessResponse(req.t('version:restoredSuccessfully'), 'message'),
        doc,
      });
  } catch (error) {
    next(error);
  }
}
