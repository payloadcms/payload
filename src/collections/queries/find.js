const { NotFound } = require('../../errors');

const find = (query) => {
  return new Promise((resolve, reject) => {
    query.Model.find({}, (err, docs) => {
      if (err || !docs) {
        reject(new NotFound());
      }

      let result = docs;

      if (query.locale) {
        docs.setLocale(query.locale, query.fallback);
        result = docs.toJSON({ virtuals: true });
      }

      resolve(result);
    });
  });
};

module.exports = find;
