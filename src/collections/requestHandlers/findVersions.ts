import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { Where } from '../../types';
import { PayloadRequest } from '../../express/types';
import { TypeWithID } from '../config/types';
import { PaginatedDocs } from '../../mongoose/types';
import findVersions from '../operations/findVersions';

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
      req,
      collection: req.collection,
      where: req.query.where as Where, // This is a little shady,
      page,
      limit: parseInt(String(req.query.limit), 10),
      sort: req.query.sort as string,
      depth: parseInt(String(req.query.depth), 10),
      payload: req.payload,
    };

    const result = await findVersions(options);

    return res.status(httpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
