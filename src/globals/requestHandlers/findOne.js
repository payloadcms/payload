const httpStatus = require('http-status');
const { NotFound } = require('../../errors');
const formatErrorResponse = require('../../express/responses/formatError');

const findOne = (Model, config) => async (req, res) => {
  try {
    const { slug } = config;

    const options = {};

    if (req.query.depth) {
      options.autopopulate = {
        maxDepth: req.query.depth,
      };
    }

    let result = await Model.findOne({ globalType: slug });

    if (!result) {
      return res.status(httpStatus.NOT_FOUND).json(formatErrorResponse(new NotFound(), 'APIError'));
    }

    if (req.query.locale && result.setLocale) {
      result.setLocale(req.query.locale, req.query['fallback-locale']);
      result = result.toJSON({ virtuals: true });
    }

    return res.status(httpStatus.OK).json(result);
  } catch (error) {
    throw error();
  }
};

module.exports = findOne;
