import httpStatus from 'http-status';
import { NotFound } from '../../errors';

export default async function deleteHandler(req, res, next) {
  try {
    const doc = await this.operations.collections.delete({
      req,
      collection: req.collection,
      id: req.params.id,
      depth: req.query.depth,
    });

    if (!doc) {
      return res.status(httpStatus.NOT_FOUND).json(new NotFound());
    }

    return res.status(httpStatus.OK).send(doc);
  } catch (error) {
    return next(error);
  }
}
