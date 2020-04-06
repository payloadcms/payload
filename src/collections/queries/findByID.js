const { NotFound } = require('../../errors');

const findByID = async (options) => {
  const mongooseOptions = {};
  const {
    depth, locale, fallbackLocale, model, id,
  } = options;

  if (depth) {
    mongooseOptions.autopopulate = {
      maxDepth: depth,
    };
  }

  try {
    // Await pre findOne hook here

    const doc = await model.findOne({ _id: id }, {}, mongooseOptions);

    if (!doc) {
      throw new NotFound();
    }

    if (locale && doc.setLocale) {
      doc.setLocale(locale, fallbackLocale);
    }

    // Await post findOne hook here

    return doc.toJSON({ virtuals: true });
  } catch (err) {
    throw err;
  }
};

module.exports = findByID;
