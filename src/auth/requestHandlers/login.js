const httpStatus = require('http-status');

async function loginHandler(req, res, next) {
  try {
    const result = await this.operations.collections.auth.login({
      req,
      res,
      collection: req.collection,
      data: req.body,
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Auth Passed',
        user: result.user,
        token: result.token,
      });
  } catch (error) {
    return next(error);
  }
}

module.exports = loginHandler;
