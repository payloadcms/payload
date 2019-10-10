const find = query => {

  return new Promise((resolve, reject) => {
    query.Model.findOne({}, (err, doc) => {

      if (err || !doc) {
        return reject({ message: 'not found' })
      }

      let result = doc;

      if (query.locale) {
        doc.setLocale(query.locale, query.fallback);
        const json = doc.toJSON({ virtuals: true });
        result = json;
      }

      resolve(result);
    })
  })
};

export default find;
