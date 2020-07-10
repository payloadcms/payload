const httpStatus = require('http-status');
const { findOne } = require('../operations');

const findOneHandler = (config, Model, globalConfig) => async (req, res, next) => {
  try {
    const { slug } = globalConfig;

    const result = await findOne({
      req,
      Model,
      config,
      globalConfig,
      slug,
      depth: req.query.depth,
    });

    return res.status(httpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = findOneHandler;
