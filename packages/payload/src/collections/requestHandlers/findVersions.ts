import type { NextFunction, Response } from 'express';

import httpStatus from 'http-status';

import type { PaginatedDocs } from '../../database/types.js';
import type { PayloadRequest } from '../../express/types.js';
import type { Where } from '../../types/index.js';
import type { TypeWithID } from '../config/types.js';

import { isNumber } from '../../utilities/isNumber.js';
import findVersions from '../operations/findVersions.js';

export default async function findVersionsHandler<T extends TypeWithID = any>(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<PaginatedDocs<T>> | void> {
  try {
    let page;

    if (typeof req.query.page === 'string') {
      const parsedPage = parseInt(req.query.page, 10);

      if (!Number.isNaN(parsedPage)) {
        page = parsedPage;
      }
    }

    const options = {
      collection: req.collection,
      depth: isNumber(req.query.depth) ? Number(req.query.depth) : undefined,
      limit: isNumber(req.query.limit) ? Number(req.query.limit) : undefined,
      page,
      payload: req.payload,
      req,
      sort: req.query.sort as string,
      where: req.query.where as Where, // This is a little shady,
    };

    const result = await findVersions(options);

    return res.status(httpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
