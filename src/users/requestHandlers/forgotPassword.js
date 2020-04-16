const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { forgotPassword } = require('../operations');

const forgotPasswordHandler = (User, config, email) => async (req, res) => {
  try {
    await forgotPassword({
      Model: User,
      config,
      api: 'REST',
      data: req.body,
      email,
    });

    return res.sendStatus(200);
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = forgotPasswordHandler;
