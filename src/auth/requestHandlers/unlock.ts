const httpStatus = require('http-status');

async function unlockHandler(req, res, next) {
  try {
    await this.operations.collections.auth.unlock({
      req,
      collection: req.collection,
      data: { email: req.body.email },
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Success',
      });
  } catch (error) {
    return next(error);
  }
}

module.exports = unlockHandler;
