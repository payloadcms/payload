const { NotFound } = require('../../errors');

const findByID = async (options) => {
  const mongooseOptions = {
    options: {},
  };

  const {
    depth, locale, fallbackLocale, model, id,
  } = options;

  if (depth && depth !== '0') {
    mongooseOptions.options.autopopulate = {
      maxDepth: parseInt(depth, 10),
    };
  } else {
    mongooseOptions.options.autopopulate = false;
  }

  try {
    // Await pre find hook here

    const result = await model.findOne({ _id: id }, {}, mongooseOptions);

    if (!result) throw new NotFound();

    if (locale && result.setLocale) {
      result.setLocale(locale, fallbackLocale);
    }

    // Await post find hook here

    return result.toJSON({ virtuals: true });
  } catch (err) {
    throw err;
  }
};

module.exports = findByID;
