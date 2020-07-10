const httpStatus = require('http-status');
const formatSuccessResponse = require('../../express/responses/formatSuccess');
const { update } = require('../operations');

const updateHandler = (config) => async (req, res, next) => {
  try {
    const user = await update({
      req,
      data: req.body,
      collection: req.collection,
      config,
      id: req.params.id,
    });

    return res.status(httpStatus.OK).json({
      ...formatSuccessResponse('Updated successfully.', 'message'),
      doc: user,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = updateHandler;
