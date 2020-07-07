const httpStatus = require('http-status');
const { findOne } = require('../operations');

const findOneHandler = (Model, config) => async (req, res, next) => {
  try {
    const { slug } = config;

    const result = await findOne({
      req,
      Model,
      config,
      slug,
      depth: req.query.depth,
    });

    return res.status(httpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = findOneHandler;
