const httpStatus = require('http-status');

const upsert = (Model, config) => async (req, res) => {
  try {
    const { slug } = config;

    let result = await Model.findOne({ globalType: slug });

    if (!result) {
      result = new Model();
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

module.exports = upsert;
