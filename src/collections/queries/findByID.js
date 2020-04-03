const findByID = async (query) => {
  const options = {};
  const { depth } = query;

  if (depth) {
    options.autopopulate = {
      maxDepth: depth,
    };
  }

  try {
    const doc = await query.Model.findOne({ _id: query.id }, {}, options);
    if (query.locale && doc.setLocale) {
      doc.setLocale(query.locale, query.fallback);
    }

    return doc.toJSON({ virtuals: true });
  } catch (err) {
    throw err;
  }
};

module.exports = findByID;
