const httpStatus = require('http-status');

async function policiesHandler(req, res, next) {
  try {
    const accessResults = await this.operations.collections.auth.access({
      req,
    });

    return res.status(httpStatus.OK)
      .json(accessResults);
  } catch (error) {
    return next(error);
  }
}

module.exports = policiesHandler;
