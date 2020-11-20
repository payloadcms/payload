import httpStatus from 'http-status';
import formatSuccessResponse from '../../express/responses/formatSuccess';

export default async function update(req, res, next) {
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
