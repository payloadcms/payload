const httpStatus = require('http-status');
const formatSuccessResponse = require('../../express/responses/formatSuccess');
const { create } = require('../operations');

const createHandler = (config) => async (req, res, next) => {
  try {
    const doc = await create({
      req,
      collection: req.collection,
      config,
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
};

module.exports = createHandler;
