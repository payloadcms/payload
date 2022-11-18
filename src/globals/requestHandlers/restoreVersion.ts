import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import formatSuccessResponse from '../../express/responses/formatSuccess';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
import { SanitizedGlobalConfig } from '../config/types';
import restoreVersion from '../operations/restoreVersion';

export default function restoreVersionHandler(globalConfig: SanitizedGlobalConfig) {
  return async function handler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Document> | void> {
    const options = {
      req,
      globalConfig,
      id: req.params.id,
      depth: Number(req.query.depth),
    };

    try {
      const doc = await restoreVersion(options);
      return res.status(httpStatus.OK).json({
        ...formatSuccessResponse(req.t('version:restoredSuccessfully'), 'message'),
        doc,
      });
    } catch (error) {
      return next(error);
    }
  };
}
