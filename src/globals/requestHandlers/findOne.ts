import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { SanitizedGlobalConfig } from '../config/types';
import { Document } from '../../types';
import findOne from '../operations/findOne';
import { isNumber } from '../../utilities/isNumber';

export type FindOneGlobalResult = Promise<Response<Document> | void>;
export type FindOneGlobalResponse = (req: PayloadRequest, res: Response, next: NextFunction) => FindOneGlobalResult;

export default function findOneHandler(globalConfig: SanitizedGlobalConfig): FindOneGlobalResponse {
  return async function handler(req: PayloadRequest, res: Response, next: NextFunction): FindOneGlobalResult {
    try {
      const { slug } = globalConfig;

      const result = await findOne({
        req,
        globalConfig,
        slug,
        depth: isNumber(req.query?.depth) ? Number(req.query.depth) : undefined,
        draft: req.query.draft === 'true',
      });

      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  };
}
