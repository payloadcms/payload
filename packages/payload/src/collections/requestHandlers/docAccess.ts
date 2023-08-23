import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { docAccess } from '../operations/docAccess';
import { CollectionPermission, GlobalPermission } from '../../auth';

export default async function docAccessRequestHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<CollectionPermission | GlobalPermission> | void> {
  try {
    const accessResults = await docAccess({
      req,
      id: req.params.id,
    });

    return res.status(httpStatus.OK).json(accessResults);
  } catch (error) {
    return next(error);
  }
}
