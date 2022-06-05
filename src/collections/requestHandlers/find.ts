import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { TypeWithID } from '../config/types';
import { PaginatedDocs } from '../../mongoose/types';
import find from '../operations/find';
import { Where } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function findHandler<T extends TypeWithID = any>(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<PaginatedDocs<T>> | void> {
  try {
    let page: number | undefined;

    if (typeof req.query.page === 'string') {
      const parsedPage = parseInt(req.query.page, 10);

      if (!Number.isNaN(parsedPage)) {
        page = parsedPage;
      }
    }

    const result = await find({
      req,
      collection: req.collection,
      where: req.query.where as Where, // This is a little shady
      page,
      limit: Number(req.query.limit),
      sort: req.query.sort as string,
      depth: Number(req.query.depth),
      draft: req.query.draft === 'true',
    });

    return res.status(httpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
