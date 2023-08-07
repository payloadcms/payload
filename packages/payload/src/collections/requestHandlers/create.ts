import httpStatus from 'http-status';
import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import formatSuccessResponse from '../../express/responses/formatSuccess';
import { Document } from '../../types';
import create from '../operations/create';
import { getTranslation } from '../../utilities/getTranslation';

export type CreateResult = {
  message: string
  doc: Document
};

export default async function createHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<CreateResult> | void> {
  try {
    const autosave = req.query.autosave === 'true';
    const draft = req.query.draft === 'true';

    const doc = await create({
      req,
      collection: req.collection,
      data: req.body,
      depth: Number(req.query.depth),
      draft,
      autosave,
    });

    return res.status(httpStatus.CREATED).json({
      ...formatSuccessResponse(req.t('general:successfullyCreated', { label: getTranslation(req.collection.config.labels.singular, req.i18n) }), 'message'),
      doc,
    });
  } catch (error) {
    return next(error);
  }
}
