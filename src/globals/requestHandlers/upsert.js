const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { upsert } = require('../operations');

const upsertHandler = (Model, config) => async (req, res) => {
  try {
    const { slug } = config;

    const result = await upsert({
      Model,
      config,
      slug,
      depth: req.query.depth,
      locale: req.locale,
      fallbackLocale: req.fallbackLocale,
      api: 'REST',
      user: req.user,
    });

    return res.status(httpStatus.OK).json({ message: 'Global saved successfully.', result });
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = upsertHandler;
