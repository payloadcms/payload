import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
import { isNumber } from '../../utilities/isNumber';
import { SanitizedGlobalConfig } from '../config/types';
import findVersionByID from '../operations/findVersionByID';

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
