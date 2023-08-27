import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types.js';
import { Document } from '../../types.js';
import { isNumber } from '../../utilities/isNumber.js';
import { SanitizedGlobalConfig } from '../config/types.js';
import findVersionByID from '../operations/findVersionByID.js';

export default function findVersionByIDHandler(globalConfig: SanitizedGlobalConfig): Document {
  return async function handler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Document> | void> {
    const options = {
      req,
      globalConfig,
      id: req.params.id,
      depth: isNumber(req.query?.depth) ? Number(req.query.depth) : undefined,
    };

    try {
      const doc = await findVersionByID(options);
      return res.json(doc);
    } catch (error) {
      return next(error);
    }
  };
}
