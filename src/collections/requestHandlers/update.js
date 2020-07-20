const httpStatus = require('http-status');
const formatSuccessResponse = require('../../express/responses/formatSuccess');
const { update } = require('../operations');

const updateHandler = (config) => async (req, res, next) => {
  try {
    const doc = await update({
      req,
      collection: req.collection,
      config,
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
};

module.exports = updateHandler;
