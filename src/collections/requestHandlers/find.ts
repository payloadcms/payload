import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { PaginatedDocs } from '../config/types';

export default async function find(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<PaginatedDocs> | void> {
  try {
    const options = {
      req,
      collection: req.collection,
      where: req.query.where,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      depth: req.query.depth,
    };

    const result = await this.operations.collections.find(options);

    return res.status(httpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
