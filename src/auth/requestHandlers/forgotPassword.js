const httpStatus = require('http-status');

async function forgotPasswordHandler(req, res, next) {
  try {
    await this.operations.collections.auth.forgotPassword({
      req,
      collection: req.collection,
      data: req.body,
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Success',
      });
  } catch (error) {
    return next(error);
  }
}

module.exports = forgotPasswordHandler;
