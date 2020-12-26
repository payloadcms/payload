import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { GlobalConfig } from '../config/types';
import { Document } from '../../types';

export type UpdateGlobalResult = Promise<Response<Document> | void>;
export type UpdateGlobalResponse = (req: PayloadRequest, res: Response, next: NextFunction) => UpdateGlobalResult;

function update(globalConfig: GlobalConfig): UpdateGlobalResponse {
  async function handler(req: PayloadRequest, res: Response, next: NextFunction) {
    try {
      const { slug } = globalConfig;

      const result = await this.operations.globals.update({
        req,
        globalConfig,
        slug,
        depth: req.query.depth,
        data: req.body,
      });

      return res.status(httpStatus.OK).json({ message: 'Global saved successfully.', result });
    } catch (error) {
      return next(error);
    }
  }

  const updateHandler = handler.bind(this);
  return updateHandler;
}

export default update;
