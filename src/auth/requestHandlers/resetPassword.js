const httpStatus = require('http-status');
const { resetPassword } = require('../operations');

const resetPasswordHandler = config => async (req, res, next) => {
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
    return next(error);
  }
};

module.exports = resetPasswordHandler;
