import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Preference } from '../types';
import findOne from '../operations/findOne';

export default async function findOneHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Preference> | void> {
  try {
    const result = await findOne({
      req,
      user: req.user,
      key: req.params.key,
    });

    return res.status(httpStatus.OK).json(result || { message: req.t('general:notFound'), value: null });
  } catch (error) {
    return next(error);
  }
}
