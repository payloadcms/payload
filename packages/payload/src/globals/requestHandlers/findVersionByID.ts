import type { NextFunction, Response } from 'express';

import type { PayloadRequest } from '../../express/types.js';
import type { Document } from '../../types/index.js';
import type { SanitizedGlobalConfig } from '../config/types.js';

import { isNumber } from '../../utilities/isNumber.js';
import findVersionByID from '../operations/findVersionByID.js';

export default function findVersionByIDHandler(globalConfig: SanitizedGlobalConfig): Document {
  return async function handler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Document> | void> {
    const options = {
      depth: isNumber(req.query?.depth) ? Number(req.query.depth) : undefined,
      globalConfig,
      id: req.params.id,
      req,
    };

    try {
      const doc = await findVersionByID(options);
      return res.json(doc);
    } catch (error) {
      return next(error);
    }
  };
}
