import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { Where } from '../../types';
import { PayloadRequest } from '../../express/types';
import formatSuccessResponse from '../../express/responses/formatSuccess';
import { Document } from '../../types';
import update from '../operations/update';

export type UpdateResult = {
  message: string
  doc: Document
};

export default async function updateHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<UpdateResult> | void> {
  try {
    const draft = req.query.draft === 'true';
    const autosave = req.query.autosave === 'true';

    const docs = await update({
      req,
      collection: req.collection,
      where: req.query.where as Where,
      data: req.body,
      depth: parseInt(String(req.query.depth), 10),
      draft,
      autosave,
    });

    let message = req.t('general:updatedSuccessfully');

    if (draft) message = req.t('version:draftSavedSuccessfully');
    if (autosave) message = req.t('version:autosavedSuccessfully');

    return res.status(httpStatus.OK).json({
      ...formatSuccessResponse(message, 'message'),
      docs,
    });
  } catch (error) {
    return next(error);
  }
}
