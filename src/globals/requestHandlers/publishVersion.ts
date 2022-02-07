import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import formatSuccessResponse from '../../express/responses/formatSuccess';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
import { SanitizedGlobalConfig } from '../config/types';

export default function (globalConfig: SanitizedGlobalConfig) {
  async function handler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Document> | void> {
    const options = {
      req,
      globalConfig,
      id: req.params.id,
      depth: req.query.depth,
    };

    try {
      const doc = await this.operations.globals.publishVersion(options);
      return res.status(httpStatus.OK).json({
        ...formatSuccessResponse('Restored successfully.', 'message'),
        doc,
      });
    } catch (error) {
      return next(error);
    }
  }

  const publishVersionHandler = handler.bind(this);
  return publishVersionHandler;
}
