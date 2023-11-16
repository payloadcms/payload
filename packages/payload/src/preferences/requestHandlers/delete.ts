import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'

import type { PayloadRequest } from '../../express/types'

import formatSuccessResponse from '../../express/responses/formatSuccess'
import deleteOperation from '../operations/delete'

export default async function deleteHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<{ message: string }> | void> {
  try {
    await deleteOperation({
      key: req.params.key,
      req,
      user: req.user,
    })

    return res.status(httpStatus.OK).json({
      ...formatSuccessResponse(req.t('deletedSuccessfully'), 'message'),
    })
  } catch (error) {
    return next(error)
  }
}
