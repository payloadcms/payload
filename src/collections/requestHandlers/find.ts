import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { TypeWithID } from '../config/types';
import { PaginatedDocs } from '../../mongoose/types';
import find from '../operations/find';
import { Where } from '../../types';
import { isNumber } from '../../utilities/isNumber';

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
      limit: isNumber(req.query.limit) ? Number(req.query.limit) : undefined,
      sort: req.query.sort as string,
      depth: isNumber(req.query.depth) ? Number(req.query.depth) : undefined,
      draft: req.query.draft === 'true',
    });

    return res.status(httpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
