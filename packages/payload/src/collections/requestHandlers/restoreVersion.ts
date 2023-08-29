import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types.js';
import { Document } from '../../types/index.js';
import formatSuccessResponse from '../../express/responses/formatSuccess.js';
import restoreVersion from '../operations/restoreVersion.js';

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
    const doc = await restoreVersion(options);
    res.status(httpStatus.OK)
      .json({
        ...formatSuccessResponse(req.t('version:restoredSuccessfully'), 'message'),
        doc,
      });
  } catch (error) {
    next(error);
  }
}
