const httpStatus = require('http-status');
const { update } = require('../operations');

const updateHandler = (config, Model, globalConfig) => async (req, res, next) => {
  try {
    const { slug } = config;

    const result = await update({
      req,
      Model,
      config,
      globalConfig,
      slug,
      depth: req.query.depth,
      data: req.body,
    });

    return res.status(httpStatus.OK).json({ message: 'Global saved successfully.', result });
  } catch (error) {
    return next(error);
  }
};

module.exports = updateHandler;
