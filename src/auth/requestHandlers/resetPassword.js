const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { resetPassword } = require('../operations');

const resetPasswordHandler = config => async (req, res) => {
  try {
    const token = await resetPassword({
      req,
      collection: req.collection,
      config,
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
