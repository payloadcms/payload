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

    const doc = await options.Model.findOne({ _id: options.id }, {}, mongooseOptions);
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
