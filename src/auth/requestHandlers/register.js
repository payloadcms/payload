const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const formatSuccessResponse = require('../../express/responses/formatSuccess');
const { register } = require('../operations');

const registerHandler = config => async (req, res) => {
  try {
    const user = await register({
      config,
      collection: req.collection,
      req,
      data: req.body,
    });

    return res.status(httpStatus.CREATED).json({
      ...formatSuccessResponse(`${req.collection.config.labels.singular} successfully created.`, 'message'),
      doc: user,
    });
  } catch (error) {
    return res.status(error.status || httpStatus.UNAUTHORIZED).json(formatErrorResponse(error));
  }
};

module.exports = registerHandler;
