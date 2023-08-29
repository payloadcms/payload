import type { NextFunction, Response } from 'express';

import httpStatus from 'http-status';

import type { TypeWithID } from '../../collections/config/types.js';
import type { PaginatedDocs } from '../../database/types.js';
import type { PayloadRequest } from '../../express/types.js';
import type { Where } from '../../types/index.js';
import type { SanitizedGlobalConfig } from '../config/types.js';

import { isNumber } from '../../utilities/isNumber.js';
import findVersions from '../operations/findVersions.js';

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
        depth: isNumber(req.query.depth) ? Number(req.query.depth) : undefined,
        globalConfig: global,
        limit: isNumber(req.query.limit) ? Number(req.query.limit) : undefined,
        page,
        req,
        sort: req.query.sort as string,
        where: req.query.where as Where,
      };

      const result = await findVersions(options);

      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  };
}
