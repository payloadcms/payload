const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { resetPassword } = require('../operations');

const resetPasswordHandler = async (req, res) => {
  try {
    const token = await resetPassword({
      req,
      Model: req.collection.Model,
      config: req.collection.config,
      data: req.body,
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Password reset',
        token,
      });
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR)
      .json(formatErrorResponse(error));
  }
};

module.exports = resetPasswordHandler;
