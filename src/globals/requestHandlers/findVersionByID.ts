import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
import { SanitizedGlobalConfig } from '../config/types';

export default function findVersionByID(globalConfig: SanitizedGlobalConfig): Document {
  async function handler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Document> | void> {
    const options = {
      req,
      globalConfig,
      id: req.params.id,
      depth: req.query.depth,
    };

    try {
      const doc = await this.operations.globals.findVersionByID(options);
      return res.json(doc);
    } catch (error) {
      return next(error);
    }
  }

  const findVersionByIDHandler = handler.bind(this);
  return findVersionByIDHandler;
}
