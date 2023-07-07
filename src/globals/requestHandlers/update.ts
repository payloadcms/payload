import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { SanitizedGlobalConfig } from '../config/types';
import { Document } from '../../types';
import update from '../operations/update';

export type UpdateGlobalResult = Promise<Response<Document> | void>;
export type UpdateGlobalResponse = (req: PayloadRequest, res: Response, next: NextFunction) => UpdateGlobalResult;

export default function updateHandler(globalConfig: SanitizedGlobalConfig): UpdateGlobalResponse {
  return async function handler(req: PayloadRequest, res: Response, next: NextFunction) {
    try {
      await req.payload.db.beginTransaction();
      const { slug } = globalConfig;
      const draft = req.query.draft === 'true';
      const autosave = req.query.autosave === 'true';

      const result = await update({
        req,
        globalConfig,
        slug,
        depth: Number(req.query.depth),
        data: req.body,
        draft,
        autosave,
      });

      let message = req.t('general:updatedSuccessfully');

      if (draft) message = req.t('version:draftSavedSuccessfully');
      if (autosave) message = req.t('version:autosavedSuccessfully');

      await req.payload.db.commitTransaction();

      res.status(httpStatus.OK).json({ message, result });
    } catch (error) {
      next(error);
    }
  };
}
