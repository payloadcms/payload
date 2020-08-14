const httpStatus = require('http-status');

async function forgotPasswordHandler(req, res, next) {
  try {
    await this.operations.collections.auth.forgotPassword({
      req,
      collection: req.collection,
      data: { email: req.body.email },
      disableEmail: req.body.disableEmail,
      expiration: req.body.expiration,
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
