const { refresh } = require('../operations');
const getExtractJWT = require('../getExtractJWT');

const refreshHandler = config => async (req, res, next) => {
  try {
    const extractJWT = getExtractJWT(config);
    const token = extractJWT(req);

    const result = await refresh({
      req,
      res,
      collection: req.collection,
      config,
      token,
    });

    return res.status(200).json({
      message: 'Token refresh successful',
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = refreshHandler;
