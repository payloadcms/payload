const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { findOne } = require('../operations');

const findOneHandler = (Model, config) => async (req, res) => {
  try {
    const { slug } = config;

    const result = await findOne({
      Model,
      config,
      slug,
      depth: req.query.depth,
      locale: req.locale,
      fallbackLocale: req.fallbackLocale,
      api: 'REST',
    });

    return res.status(httpStatus.OK).json(result);
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = findOneHandler;
