const { NotFound } = require('../../errors');

const modelById = (query) => {
  const options = {};
  const { depth } = query;

  if (depth) {
    options.autopopulate = {
      maxDepth: depth,
    };
  }

  return new Promise((resolve, reject) => {
    query.Model.findOne({ _id: query.id }, {}, options, (err, doc) => {
      if (err || !doc) {
        reject(new NotFound());
        return;
      }

      let result = doc;

      if (query.locale) {
        if (doc.setLocale) doc.setLocale(query.locale, query.fallback);
        result = doc.toJSON({ virtuals: true });
      }

      resolve(options.returnRawDoc
        ? doc
        : result);
    });
  });
};

module.exports = modelById;
