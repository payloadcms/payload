import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import formatSuccessResponse from '../../express/responses/formatSuccess';
import update from '../operations/update';

export type UpdatePreferenceResult = Promise<Response<Document> | void>;
export type UpdatePreferenceResponse = (req: PayloadRequest, res: Response, next: NextFunction) => UpdatePreferenceResult;

export default async function updateHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<any> | void> {
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
