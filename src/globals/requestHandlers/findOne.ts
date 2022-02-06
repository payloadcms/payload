import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { SanitizedGlobalConfig } from '../config/types';
import { Document } from '../../types';

export type FindOneGlobalResult = Promise<Response<Document> | void>;
export type FindOneGlobalResponse = (req: PayloadRequest, res: Response, next: NextFunction) => FindOneGlobalResult;

export default function findOne(globalConfig: SanitizedGlobalConfig): FindOneGlobalResponse {
  async function handler(req: PayloadRequest, res: Response, next: NextFunction): FindOneGlobalResult {
    try {
      const { slug } = globalConfig;

      const result = await this.operations.globals.findOne({
        req,
        globalConfig,
        slug,
        depth: req.query.depth,
        draft: req.query.draft === 'true',
      });

      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  }

  const findOneHandler = handler.bind(this);

  return findOneHandler;
}
