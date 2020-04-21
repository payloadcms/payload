const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { resetPassword } = require('../operations');

const resetPasswordHandler = async (req, res) => {
  try {
    await resetPassword({
      req,
      Model: req.Model,
      data: req.body,
    });

    return res.status(200).json({ message: 'Password successfully reset' });
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = resetPasswordHandler;
