import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Preference } from '../types';

export default async function findOne(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<Preference> | void> {
  try {
    const result = await this.operations.preferences.findOne({
      req,
      user: req.user,
      key: req.params.key,
    });

    return res.status(httpStatus.OK).json(result || { message: 'No Preference Found', value: null });
  } catch (error) {
    return next(error);
  }
}
