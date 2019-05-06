const modelById = (query, returnRawDoc) => {

  return new Promise((resolve, reject) => {
    query.Model.findOne({ _id: query.id }, (err, doc) => {

      if (err || !doc) {
        return reject({ message: 'not found' })
      }

      let result = doc;

      if (query.locale) {
        doc.setLocale(query.locale, query.fallback);
        result = doc.toJSON({ virtuals: true });
      }

      resolve(returnRawDoc
        ? doc
        : result);
    })
  })
};

export default modelById;
