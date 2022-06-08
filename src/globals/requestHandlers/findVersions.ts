import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { TypeWithID } from '../../collections/config/types';
import { PaginatedDocs } from '../../mongoose/types';
import { SanitizedGlobalConfig } from '../config/types';
import findVersions from '../operations/findVersions';
import { Where } from '../../types';

export default function findVersionsHandler(global: SanitizedGlobalConfig) {
  return async function handler<T extends TypeWithID = any>(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<PaginatedDocs<T>> | void> {
    try {
      let page;

      if (typeof req.query.page === 'string') {
        const parsedPage = parseInt(req.query.page, 10);

        if (!Number.isNaN(parsedPage)) {
          page = parsedPage;
        }
      }

      const options = {
        req,
        globalConfig: global,
        where: req.query.where as Where,
        page,
        limit: Number(req.query.limit),
        sort: req.query.sort as string,
        depth: Number(req.query.depth),
      };

      const result = await findVersions(options);

      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  };
}
