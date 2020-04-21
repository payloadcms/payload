const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { forgotPassword } = require('../operations');

const forgotPasswordHandler = (config, email) => async (req, res) => {
  try {
    await forgotPassword({
      Model: req.Model,
      config,
      api: 'REST',
      data: req.body,
      email,
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Success',
      });
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = forgotPasswordHandler;
