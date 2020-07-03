const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { refresh } = require('../operations');

const refreshHandler = config => async (req, res) => {
  try {
    const result = await refresh({
      req,
      res,
      collection: req.collection,
      config,
      authorization: req.headers.authorization,
    });

    return res.status(200).json({
      message: 'Token refresh successful',
      ...result,
    });
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = refreshHandler;
