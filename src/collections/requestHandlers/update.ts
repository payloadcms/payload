import { Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types/payloadRequest';
import formatSuccessResponse from '../../express/responses/formatSuccess';

export type UpdateRequestHandler = (req: PayloadRequest, res: Response, next: NextFunction) => unknown;

export type UpdateResult = {
  message: string
  doc: Document
};

export default async function update(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<UpdateResult> | void> {
  try {
    const doc = await this.operations.collections.update({
      req,
      collection: req.collection,
      id: req.params.id,
      data: req.body,
      depth: req.query.depth,
    });

    return res.status(httpStatus.OK).json({
      ...formatSuccessResponse('Updated successfully.', 'message'),
      doc,
    });
  } catch (error) {
    return next(error);
  }
}
