import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { Where, Document } from '../../types';
import { PayloadRequest } from '../../express/types';
import formatSuccessResponse from '../../express/responses/formatSuccess';
import update from '../operations/update';
import { getTranslation } from '../../utilities/getTranslation';

export type UpdateResult = {
  message: string
  doc: Document
};

export default async function updateHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<UpdateResult> | void> {
  try {
    const draft = req.query.draft === 'true';

    const result = await update({
      req,
      collection: req.collection,
      where: req.query.where as Where,
      data: req.body,
      depth: parseInt(String(req.query.depth), 10),
      draft,
    });

    if (result.errors.length === 0) {
      const message = req.t('general:updatedCountSuccessfully', {
        count: result.docs.length,
        label: getTranslation(req.collection.config.labels[result.docs.length > 1 ? 'plural' : 'singular'], req.i18n),
      });

      return res.status(httpStatus.OK).json({
        ...formatSuccessResponse(message, 'message'),
        ...result,
      });
    }

    const total = result.docs.length + result.errors.length;
    const message = req.t('error:unableToUpdateCount', {
      count: result.errors.length,
      total,
      label: getTranslation(req.collection.config.labels[total > 1 ? 'plural' : 'singular'], req.i18n),
    });

    return res.status(httpStatus.BAD_REQUEST).json({
      ...formatSuccessResponse(message, 'message'),
      ...result,
    });
  } catch (error) {
    return next(error);
  }
}
