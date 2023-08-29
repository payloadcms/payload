import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { PayloadRequest } from '../../express/types.js';
import formatSuccessResponse from '../../express/responses/formatSuccess.js';
import update from '../operations/update.js';

export default async function updateHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<GeneratedTypes['collections']['_preference']> | void> {
  try {
    const doc = await update({
      req,
      user: req.user,
      key: req.params.key,
      value: req.body.value || req.body,
    });

    return res.status(httpStatus.OK).json({
      ...formatSuccessResponse(req.t('general:updatedSuccessfully'), 'message'),
      doc,
    });
  } catch (error) {
    return next(error);
  }
}
