const httpStatus = require('http-status');
const { forgotPassword } = require('../operations');

const forgotPasswordHandler = (config, email) => async (req, res, next) => {
  try {
    await forgotPassword({
      req,
      collection: req.collection,
      config,
      data: req.body,
      email,
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Success',
      });
  } catch (error) {
    return next(error);
  }
};

module.exports = forgotPasswordHandler;
