import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Document, Where } from '../../types';
import deleteOperation from '../operations/delete';
import formatSuccessResponse from '../../express/responses/formatSuccess';
import { getTranslation } from '../../utilities/getTranslation';

export type DeleteResult = {
  message: string;
  doc: Document;
}

export default async function deleteHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<DeleteResult> | void> {
  try {
    const result = await deleteOperation({
      req,
      collection: req.collection,
      where: req.query.where as Where,
      depth: parseInt(String(req.query.depth), 10),
    });

    if (result.errors.length === 0) {
      const message = req.t('general:deletedCountSuccessfully', {
        count: result.docs.length,
        label: getTranslation(req.collection.config.labels[result.docs.length > 1 ? 'plural' : 'singular'], req.i18n),
      });

      return res.status(httpStatus.OK).json({
        ...formatSuccessResponse(message, 'message'),
        ...result,
      });
    }

    const total = result.docs.length + result.errors.length;
    const message = req.t('error:unableToDeleteCount', {
      count: result.errors.length,
      total,
      label: getTranslation(req.collection.config.labels[total > 1 ? 'plural' : 'singular'], req.i18n),
    });

    return res.status(httpStatus.BAD_REQUEST).json({
      message,
      ...result,
    });
  } catch (error) {
    return next(error);
  }
}
