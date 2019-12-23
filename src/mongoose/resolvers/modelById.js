import { NotFound } from '../../errors';

const modelById = (query, options) => {
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

export default modelById;
