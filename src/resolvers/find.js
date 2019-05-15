const find = query => {

  return new Promise((resolve, reject) => {
    query.Model.find({}, (err, docs) => {

      // if (err || !doc) {
      //   return reject({ message: 'not found' })
      // }

      let result = docs;

      if (query.locale) {
        docs.setLocale(query.locale, query.fallback);
        const json = docs.toJSON({ virtuals: true });
        result = json;
      }

      resolve(result);
    })
  })
};

export default find;
