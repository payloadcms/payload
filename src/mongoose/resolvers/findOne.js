const { NotFound } = require('../../errors');

const find = ({
  Model, locale, fallback, depth,
}) => {
  const options = {};

  if (depth) {
    options.autopopulate = {
      maxDepth: depth,
    };
  }

  return new Promise((resolve, reject) => {
    Model.findOne(null, null, options, (err, doc) => {
      if (err || !doc) {
        reject(new NotFound());
        return;
      }

      let result = doc;

      if (locale) {
        doc.setLocale(locale, fallback);
        result = doc.toJSON({ virtuals: true });
      }

      resolve(result);
    });
  });
};

module.exports = find;
