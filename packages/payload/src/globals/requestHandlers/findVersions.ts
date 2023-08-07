import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { TypeWithID } from '../../collections/config/types';
import { PaginatedDocs } from '../../mongoose/types';
import { SanitizedGlobalConfig } from '../config/types';
import findVersions from '../operations/findVersions';
import { Where } from '../../types';
import { isNumber } from '../../utilities/isNumber';

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
        limit: isNumber(req.query.limit) ? Number(req.query.limit) : undefined,
        sort: req.query.sort as string,
        depth: isNumber(req.query.depth) ? Number(req.query.depth) : undefined,
      };

      const result = await findVersions(options);

      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  };
}
