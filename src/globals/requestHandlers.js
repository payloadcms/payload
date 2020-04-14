const httpStatus = require('http-status');
const { NotFound } = require('../errors');
const formatErrorResponse = require('../express/responses/formatError');

const upsert = async (req, res) => {
  try {
    const { slug } = req.global;

    let result = await req.Model.findOne({ globalType: slug });

    if (!result) {
      result = new req.Model();
    }

    if (req.query.locale && result.setLocale) {
      result.setLocale(req.query.locale, req.query['fallback-locale']);
    }

    Object.assign(result, { ...req.body, globalType: slug });

    result.save();

    result = result.toJSON({ virtuals: true });

    return res.status(httpStatus.CREATED).json({ message: 'Global saved successfully.', result });
  } catch (error) {
    throw error;
  }
};

const findOne = async (req, res) => {
  try {
    const { slug } = req.global;

    const options = {};

    if (req.query.depth) {
      options.autopopulate = {
        maxDepth: req.query.depth,
      };
    }

    let result = await req.Model.findOne({ globalType: slug });

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

module.exports = {
  findOne,
  upsert,
};
