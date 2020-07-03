const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { login } = require('../operations');

const loginHandler = config => async (req, res) => {
  try {
    const token = await login({
      req,
      res,
      collection: req.collection,
      config,
      data: req.body,
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Auth Passed',
        token,
      });
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = loginHandler;
