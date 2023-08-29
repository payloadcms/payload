import type { NextFunction, Response } from 'express';

import httpStatus from 'http-status';

import type { PayloadRequest } from '../../express/types.js';
import type { Document } from '../../types/index.js';

import formatSuccessResponse from '../../express/responses/formatSuccess.js';
import { getTranslation } from '../../utilities/getTranslation.js';
import create from '../operations/create.js';

export type CreateResult = {
  doc: Document
  message: string
};

export default async function createHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<CreateResult> | void> {
  try {
    const autosave = req.query.autosave === 'true';
    const draft = req.query.draft === 'true';

    const doc = await create({
      autosave,
      collection: req.collection,
      data: req.body,
      depth: Number(req.query.depth),
      draft,
      req,
    });

    res.status(httpStatus.CREATED).json({
      ...formatSuccessResponse(req.t('general:successfullyCreated', { label: getTranslation(req.collection.config.labels.singular, req.i18n) }), 'message'),
      doc,
    });
  } catch (error) {
    next(error);
  }
}
