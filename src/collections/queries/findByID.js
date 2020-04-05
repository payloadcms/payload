const { NotFound } = require('../../errors');

const findByID = async (options) => {
  const mongooseOptions = {};
  const { depth } = options;

  if (depth) {
    mongooseOptions.autopopulate = {
      maxDepth: depth,
    };
  }

  try {
    // Await pre findOne hook here

    const doc = await options.model.findOne({ _id: options.id }, {}, mongooseOptions);

    if (!doc) {
      throw new NotFound();
    }

    if (options.locale && doc.setLocale) {
      doc.setLocale(options.locale, options.fallback);
    }

    // Await post findOne hook here

    return doc.toJSON({ virtuals: true });
  } catch (err) {
    throw err;
  }
};

module.exports = findByID;
