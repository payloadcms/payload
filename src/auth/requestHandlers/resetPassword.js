const httpStatus = require('http-status');

async function resetPassword(req, res, next) {
  try {
    const token = await this.operations.collections.auth.resetPassword({
      req,
      collection: req.collection,
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
}

module.exports = resetPassword;
