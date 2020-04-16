const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { refresh } = require('../operations');

const refreshHandler = config => async (req, res) => {
  try {
    const refreshedToken = await refresh({
      config,
      api: 'REST',
      authorization: req.headers.authorization,
    });

    res.status(200).json({
      message: 'Token refresh successful',
      refreshedToken,
    });
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = refreshHandler;
