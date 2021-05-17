import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import formatSuccessResponse from '../../express/responses/formatSuccess';

export default async function deleteHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<any> | void> {
  try {
    await this.operations.preferences.delete({
      req,
      user: req.user,
      key: req.params.key,
    });

    return res.status(httpStatus.OK).json({
      ...formatSuccessResponse('Deleted successfully.', 'message'),
    });
  } catch (error) {
    return next(error);
  }
}
