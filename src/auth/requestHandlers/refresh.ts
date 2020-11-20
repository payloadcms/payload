const getExtractJWT = require('../getExtractJWT');

async function refreshHandler(req, res, next) {
  try {
    const extractJWT = getExtractJWT(this.config);
    const token = extractJWT(req);

    const result = await this.operations.collections.auth.refresh({
      req,
      res,
      collection: req.collection,
      token,
    });

    return res.status(200).json({
      message: 'Token refresh successful',
      ...result,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = refreshHandler;
