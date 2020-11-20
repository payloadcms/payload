const httpStatus = require('http-status');
const formatSuccessResponse = require('../../express/responses/formatSuccess');

async function create(req, res, next) {
  try {
    const doc = await this.operations.collections.create({
      req,
      collection: req.collection,
      data: req.body,
      depth: req.query.depth,
    });

    return res.status(httpStatus.CREATED).json({
      ...formatSuccessResponse(`${req.collection.config.labels.singular} successfully created.`, 'message'),
      doc,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = create;
