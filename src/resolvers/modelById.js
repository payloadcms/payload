const modelById = (query, options) => {

  return new Promise((resolve, reject) => {
    query.Model.findOne({ _id: query.id }, {}, options, (err, doc) => {

      if (err || !doc) {
        return reject({ message: 'not found' })
      }

      let result = doc;

      if (query.locale) {
        query.Model.setDefaultLocale(query.locale, query.fallback);
        result = doc.toJSON({ virtuals: true });
      }

      resolve(options.returnRawDoc
        ? doc
        : result);
    })
  })
};

export default modelById;
