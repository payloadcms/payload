const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { refresh } = require('../operations');
const getExtractJWT = require('../getExtractJWT');

const refreshHandler = config => async (req, res) => {
  try {
    const extractJWT = getExtractJWT(config);
    const token = extractJWT(req);

    const result = await refresh({
      req,
      res,
      collection: req.collection,
      config,
      token,
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
