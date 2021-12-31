import { Response, NextFunction } from 'express';
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
      return res.json(doc);
    } catch (error) {
      return next(error);
    }
  }

  const publishVersionHandler = handler.bind(this);
  return publishVersionHandler;
}
