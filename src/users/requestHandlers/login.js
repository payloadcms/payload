const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { login } = require('../operations');

/**
   * Returns passport login response (JWT) when valid username and password is provided
   * @param req
   * @param res
   * @returns {*}
   */
const loginHandler = (User, config) => async (req, res) => {
  try {
    const token = await login({
      Model: User,
      config: config.user,
      data: req.body,
      api: 'REST',
    });

    return res.status(200)
      .json({
        message: 'Auth Passed',
        token,
      });
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = loginHandler;
